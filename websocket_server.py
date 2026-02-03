import os
import json
import logging
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from ai_services import AIServiceManager
from auth_service import auth_service
import jwt
import time
import threading

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self, app=None, socketio=None):
        self.app = app
        self.socketio = socketio or SocketIO(app, cors_allowed_origins="*")
        self.ai_manager = None
        self.active_generations = {}  # session_id: generation_info
        self.rooms = {}  # room_id: {users: set, data: dict}

        # Initialize AI services if API keys are available
        openai_key = os.getenv('OPENAI_API_KEY')
        replicate_token = os.getenv('REPLICATE_API_TOKEN')
        if openai_key and replicate_token:
            self.ai_manager = AIServiceManager(openai_key, replicate_token)
        else:
            logger.warning("AI API keys not configured - WebSocket AI features will be limited")

        self._register_events()

    def _register_events(self):
        """Register all SocketIO event handlers"""

        @self.socketio.on('connect')
        def handle_connect():
            logger.info(f"Client connected: {request.sid}")
            emit('connected', {'status': 'success', 'sid': request.sid})

        @self.socketio.on('disconnect')
        def handle_disconnect():
            logger.info(f"Client disconnected: {request.sid}")
            # Clean up any active generations for this session
            self._cleanup_session(request.sid)

        @self.socketio.on('authenticate')
        def handle_authenticate(data):
            """Authenticate user with JWT token"""
            token = data.get('token')
            if not token:
                emit('auth_error', {'error': 'No token provided'})
                return False

            try:
                payload = auth_service.verify_token(token)
                if payload:
                    # Store user info in session
                    self.socketio.server.environ[request.sid]['user'] = payload
                    emit('authenticated', {'user': payload})
                    logger.info(f"User authenticated: {payload.get('username')}")
                    return True
                else:
                    emit('auth_error', {'error': 'Invalid token'})
                    return False
            except Exception as e:
                logger.error(f"Authentication error: {e}")
                emit('auth_error', {'error': 'Authentication failed'})
                return False

        @self.socketio.on('join_room')
        def handle_join_room(data):
            """Join a collaborative room"""
            room_id = data.get('room_id')
            user = self._get_current_user()
            if not user:
                emit('error', {'error': 'Authentication required'})
                return

            join_room(room_id)
            if room_id not in self.rooms:
                self.rooms[room_id] = {'users': set(), 'data': {}}
            self.rooms[room_id]['users'].add(user['username'])

            emit('room_joined', {
                'room_id': room_id,
                'users': list(self.rooms[room_id]['users']),
                'data': self.rooms[room_id]['data']
            })

            # Notify other users in room
            emit('user_joined', {
                'username': user['username'],
                'room_id': room_id
            }, room=room_id, skip_sid=request.sid)

            logger.info(f"User {user['username']} joined room {room_id}")

        @self.socketio.on('leave_room')
        def handle_leave_room(data):
            """Leave a collaborative room"""
            room_id = data.get('room_id')
            user = self._get_current_user()
            if not user:
                return

            leave_room(room_id)
            if room_id in self.rooms:
                self.rooms[room_id]['users'].discard(user['username'])
                if not self.rooms[room_id]['users']:
                    del self.rooms[room_id]

            emit('room_left', {'room_id': room_id})

            # Notify other users in room
            emit('user_left', {
                'username': user['username'],
                'room_id': room_id
            }, room=room_id, skip_sid=request.sid)

            logger.info(f"User {user['username']} left room {room_id}")

        @self.socketio.on('collaborative_edit')
        def handle_collaborative_edit(data):
            """Handle collaborative editing updates"""
            room_id = data.get('room_id')
            edit_data = data.get('edit_data')
            user = self._get_current_user()
            if not user:
                emit('error', {'error': 'Authentication required'})
                return

            if room_id not in self.rooms:
                emit('error', {'error': 'Room not found'})
                return

            # Update room data
            self.rooms[room_id]['data'] = edit_data

            # Broadcast to other users in room
            emit('edit_update', {
                'username': user['username'],
                'edit_data': edit_data,
                'timestamp': time.time()
            }, room=room_id, skip_sid=request.sid)

        @self.socketio.on('generation_start')
        def handle_generation_start(data):
            """Start AI generation process"""
            user = self._get_current_user()
            if not user:
                emit('error', {'error': 'Authentication required'})
                return

            if not self.ai_manager:
                emit('generation_error', {'error': 'AI services not configured'})
                return

            prompt = data.get('prompt')
            generation_type = data.get('type', 'image')  # text, image, video, 3d
            provider = data.get('provider', 'openai')
            model = data.get('model', 'dall-e-3')

            if not prompt:
                emit('generation_error', {'error': 'Prompt required'})
                return

            session_id = f"{request.sid}_{time.time()}"
            self.active_generations[session_id] = {
                'user': user['username'],
                'type': generation_type,
                'status': 'starting',
                'progress': 0,
                'start_time': time.time()
            }

            emit('generation_started', {
                'session_id': session_id,
                'type': generation_type,
                'status': 'starting'
            })

            # Start generation in background thread
            thread = threading.Thread(
                target=self._run_generation,
                args=(session_id, prompt, generation_type, provider, model)
            )
            thread.daemon = True
            thread.start()

            logger.info(f"Generation started: {session_id} by {user['username']}")

        @self.socketio.on('generation_progress')
        def handle_generation_progress(data):
            """Request current generation progress"""
            session_id = data.get('session_id')
            if session_id not in self.active_generations:
                emit('generation_error', {'error': 'Generation session not found'})
                return

            generation = self.active_generations[session_id]
            emit('generation_update', {
                'session_id': session_id,
                'status': generation['status'],
                'progress': generation['progress'],
                'message': generation.get('message', '')
            })

        @self.socketio.on('cancel_generation')
        def handle_cancel_generation(data):
            """Cancel an active generation"""
            session_id = data.get('session_id')
            user = self._get_current_user()
            if not user:
                emit('error', {'error': 'Authentication required'})
                return

            if session_id not in self.active_generations:
                emit('generation_error', {'error': 'Generation session not found'})
                return

            generation = self.active_generations[session_id]
            if generation['user'] != user['username']:
                emit('generation_error', {'error': 'Unauthorized'})
                return

            generation['status'] = 'cancelled'
            emit('generation_cancelled', {'session_id': session_id})
            logger.info(f"Generation cancelled: {session_id}")

    def _run_generation(self, session_id, prompt, generation_type, provider, model):
        """Run AI generation in background thread"""
        try:
            generation = self.active_generations[session_id]
            generation['status'] = 'processing'
            generation['progress'] = 25

            # Emit progress update
            self.socketio.emit('generation_update', {
                'session_id': session_id,
                'status': 'processing',
                'progress': 25,
                'message': 'Initializing generation...'
            }, room=request.sid)

            # Call appropriate AI service method
            if generation_type == 'text':
                result, filepath = self.ai_manager.generate_text(prompt, model)
                output = result
            elif generation_type == 'image':
                output, filepath = self.ai_manager.generate_image(prompt, provider, model)
            elif generation_type == 'video':
                output, filepath = self.ai_manager.generate_video(prompt)
            elif generation_type == '3d':
                output, filepath = self.ai_manager.generate_3d(prompt)
            else:
                raise ValueError(f"Unsupported generation type: {generation_type}")

            generation['status'] = 'completed'
            generation['progress'] = 100
            generation['result'] = output
            generation['filepath'] = filepath

            # Emit completion
            self.socketio.emit('generation_complete', {
                'session_id': session_id,
                'type': generation_type,
                'result': output,
                'filepath': filepath,
                'prompt': prompt
            }, room=request.sid)

            logger.info(f"Generation completed: {session_id}")

        except Exception as e:
            logger.error(f"Generation error for {session_id}: {e}")
            generation = self.active_generations.get(session_id, {})
            generation['status'] = 'error'
            generation['error'] = str(e)

            self.socketio.emit('generation_error', {
                'session_id': session_id,
                'error': str(e)
            }, room=request.sid)

        finally:
            # Clean up after some time
            def cleanup():
                time.sleep(300)  # Keep for 5 minutes
                self.active_generations.pop(session_id, None)
            threading.Timer(300, cleanup).start()

    def _get_current_user(self):
        """Get current authenticated user from session"""
        try:
            return self.socketio.server.environ[request.sid].get('user')
        except:
            return None

    def _cleanup_session(self, sid):
        """Clean up resources for disconnected session"""
        # Remove from rooms
        for room_id, room_data in self.rooms.items():
            room_data['users'] = {u for u in room_data['users'] if u != sid}

        # Cancel any active generations
        to_remove = []
        for session_id, generation in self.active_generations.items():
            if session_id.startswith(sid):
                generation['status'] = 'cancelled'
                to_remove.append(session_id)
        for session_id in to_remove:
            del self.active_generations[session_id]

# Global instance for easy access
websocket_server = None

def init_websocket_server(app):
    """Initialize WebSocket server with Flask app"""
    global websocket_server
    websocket_server = WebSocketServer(app)
    return websocket_server.socketio

# Export the WebSocketServer instance for use in ai_assistant.py
def get_websocket_server():
    """Get the global WebSocket server instance"""
    return websocket_server