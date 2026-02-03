import os
import json
import logging
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from ai_services import AIServiceManager
from websocket_server import init_websocket_server
from auth_service import auth_service, owner_required, token_required
import threading
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8000", "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"], "allow_headers": ["Content-Type", "Authorization"]}})

# Initialize AI services
openai_key = os.getenv('OPENAI_API_KEY')
replicate_token = os.getenv('REPLICATE_API_TOKEN')

if not openai_key or not replicate_token:
    logger.warning("AI API keys not configured - AI generation features will be limited")
    ai_manager = None
else:
    ai_manager = AIServiceManager(openai_key, replicate_token)

# Initialize WebSocket server
socketio = init_websocket_server(app)

# Global storage for active generations
active_generations = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ai_services': ai_manager is not None,
        'websocket': socketio is not None
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    mfa_code = data.get('mfa_code')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    success, result = auth_service.authenticate_user(username, password, mfa_code)
    if not success:
        return jsonify({'error': result}), 401

    token = auth_service.generate_token(result)
    return jsonify({
        'token': token,
        'user': {
            'username': result['username'],
            'role': result['role']
        }
    })

@app.route('/api/ai/generate/text', methods=['POST'])
@owner_required
def generate_text():
    """Generate text using AI"""
    data = request.get_json()
    prompt = data.get('prompt')
    model = data.get('model', 'gpt-4')

    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400

    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    try:
        result, filepath = ai_manager.generate_text(prompt, model)
        return jsonify({
            'type': 'text',
            'result': result,
            'filepath': filepath,
            'prompt': prompt,
            'model': model
        })
    except Exception as e:
        logger.error(f"Text generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/generate/image', methods=['POST'])
@owner_required
def generate_image():
    """Generate image using AI"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    prompt = data.get('prompt')
    provider = data.get('provider', 'openai')
    model = data.get('model', 'dall-e-3')

    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400

    try:
        result, filepath = ai_manager.generate_image(prompt, provider, model)
        return jsonify({
            'type': 'image',
            'result': result,
            'filepath': filepath,
            'prompt': prompt,
            'provider': provider,
            'model': model
        })
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/generate/video', methods=['POST'])
@owner_required
def generate_video():
    """Generate video using AI"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400

    try:
        result, filepath = ai_manager.generate_video(prompt)
        return jsonify({
            'type': 'video',
            'result': result,
            'filepath': filepath,
            'prompt': prompt
        })
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/generate/3d', methods=['POST'])
@owner_required
def generate_3d():
    """Generate 3D model using AI"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400

    try:
        result, filepath = ai_manager.generate_3d(prompt)
        return jsonify({
            'type': '3d',
            'result': result,
            'filepath': filepath,
            'prompt': prompt
        })
    except Exception as e:
        logger.error(f"3D generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/generate/music', methods=['POST'])
@owner_required
def generate_music():
    """"Generate music using AI"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    prompt = data.get('prompt')
    genre = data.get('genre', 'auto')
    duration = data.get('duration', 30)
    style = data.get('style', 'advanced')

    if not prompt:
        return jsonify({'error': 'Prompt required'}), 400

    try:
        result, filepath = ai_manager.generate_music(prompt, genre, duration, style)
        return jsonify({
            'type': 'music',
            'result': result,
            'filepath': filepath,
            'prompt': prompt,
            'genre': genre,
            'duration': duration,
            'style': style
        })
    except Exception as e:
        logger.error(f"Music generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/clone/avatar', methods=['POST'])
@owner_required
def clone_avatar():
    """"Clone avatar using AI"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    source_image_path = data.get('source_image_path')
    target_video_path = data.get('target_video_path')
    style = data.get('style', 'hyper_realistic')

    if not source_image_path:
        return jsonify({'error': 'Source image path required'}), 400

    try:
        result, filepath = ai_manager.clone_avatar(source_image_path, target_video_path, style)
        return jsonify({
            'type': 'avatar',
            'result': result,
            'filepath': filepath,
            'source_image_path': source_image_path,
            'target_video_path': target_video_path,
            'style': style
        })
    except Exception as e:
        logger.error(f"Avatar cloning error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/analyze', methods=['POST'])
@owner_required
def analyze_ai():
    """"Analyze AI capabilities"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    ai_description = data.get('ai_description')
    ai_outputs = data.get('ai_outputs')

    if not ai_description:
        return jsonify({'error': 'AI description required'}), 400

    try:
        analysis, filepath = ai_manager.analyze_ai_capabilities(ai_description, ai_outputs)
        return jsonify({
            'type': 'analysis',
            'result': analysis,
            'filepath': filepath,
            'ai_description': ai_description,
            'ai_outputs': ai_outputs
        })
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/enhanced/create', methods=['POST'])
@owner_required
def enhanced_content_creation():
    """"Create enhanced multi-modal content"""
    if not ai_manager:
        return jsonify({'error': 'AI services not configured'}), 503

    data = request.get_json()
    base_prompt = data.get('base_prompt')
    content_types = data.get('content_types', ['text', 'image', 'music'])
    enhancement_level = data.get('enhancement_level', 'maximum')

    if not base_prompt:
        return jsonify({'error': 'Base prompt required'}), 400

    try:
        results, metadata_path = ai_manager.enhanced_content_creation(base_prompt, content_types, enhancement_level)
        return jsonify({
            'type': 'enhanced',
            'results': results,
            'metadata_path': metadata_path,
            'base_prompt': base_prompt,
            'content_types': content_types,
            'enhancement_level': enhancement_level
        })
    except Exception as e:
        logger.error(f"Enhanced content creation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/memory/learn', methods=['POST'])
@owner_required
def learn_memory():
    """"Learn data with photographic memory"""
    from ai_services import photographic_memory
    
    data = request.get_json()
    learn_data = data.get('data')
    context = data.get('context', 'general')

    if not learn_data:
        return jsonify({'error': 'Data required'}), 400

    try:
        key = photographic_memory.learn(learn_data, context)
        return jsonify({
            'key': key,
            'context': context
        })
    except Exception as e:
        logger.error(f"Memory learning error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/memory/recall', methods=['POST'])
@owner_required
def recall_memory():
    """"Recall data from photographic memory"""
    from ai_services import photographic_memory
    
    data = request.get_json()
    key = data.get('key')

    if not key:
        return jsonify({'error': 'Key required'}), 400

    try:
        result = photographic_memory.recall(key)
        return jsonify({
            'result': result
        })
    except Exception as e:
        logger.error(f"Memory recall error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/generations', methods=['GET'])
@owner_required
def list_generations():
    """List all generated content"""
    base_dir = "ai_generated"
    generations = []

    if os.path.exists(base_dir):
        for subdir in ['text', 'image', 'video', '3d', 'music', 'avatar', 'analysis', 'enhanced']:
            subdir_path = os.path.join(base_dir, subdir)
            if os.path.exists(subdir_path):
                for filename in os.listdir(subdir_path):
                    if filename.endswith('.json'):
                        metadata_path = os.path.join(subdir_path, filename)
                        try:
                            with open(metadata_path, 'r') as f:
                                metadata = json.load(f)
                                generations.append(metadata)
                        except Exception as e:
                            logger.error(f"Error reading metadata {metadata_path}: {e}")

    return jsonify({'generations': generations})

@app.route('/api/ai/generation/<generation_id>', methods=['GET'])
@owner_required
def get_generation(generation_id):
    """Get specific generation details"""
    base_dir = "ai_generated"

    for subdir in ['text', 'image', 'video', '3d', 'music', 'avatar', 'analysis', 'enhanced']:
        metadata_path = os.path.join(base_dir, subdir, f"{generation_id}.json")
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                    return jsonify(metadata)
            except Exception as e:
                logger.error(f"Error reading metadata {metadata_path}: {e}")
                return jsonify({'error': 'Failed to read generation data'}), 500

    return jsonify({'error': 'Generation not found'}), 404

@app.route('/api/collaborative/rooms', methods=['GET'])
@token_required
def list_rooms():
    """List active collaborative rooms"""
    # This would need to be implemented in websocket_server.py
    # For now, return empty list
    return jsonify({'rooms': []})

@app.route('/api/collaborative/room/<room_id>', methods=['POST'])
@token_required
def create_room(room_id):
    """Create a collaborative room"""
    # Room creation is handled via WebSocket
    return jsonify({'status': 'Room creation handled via WebSocket'})

@app.route('/api/websocket/status', methods=['GET'])
@token_required
def websocket_status():
    """Get WebSocket server status"""
    return jsonify({
        'status': 'active',
        'active_generations': len(active_generations),
        'rooms': len(socketio.server.rooms) if socketio.server else 0
    })

# WebSocket event handlers for collaborative features
def register_collaborative_events(socketio_instance):
    """Register collaborative WebSocket events"""

    @socketio_instance.on('collaborative_generation_start')
    def handle_collaborative_generation(data):
        """Start collaborative AI generation"""
        # Note: WebSocket events don't have Flask g context, so we need to authenticate differently
        # For now, assume authentication is handled at connection time
        if not ai_manager:
            socketio_instance.emit('generation_error', {'error': 'AI services not configured'})
            return

        room_id = data.get('room_id')
        prompt = data.get('prompt')
        generation_type = data.get('type', 'image')
        provider = data.get('provider', 'openai')
        model = data.get('model', 'dall-e-3')

        if not room_id or not prompt:
            socketio_instance.emit('generation_error', {'error': 'Room ID and prompt required'})
            return

        session_id = f"collab_{room_id}_{time.time()}"
        active_generations[session_id] = {
            'user': 'collaborative',  # Placeholder
            'room_id': room_id,
            'type': generation_type,
            'status': 'starting',
            'progress': 0,
            'start_time': time.time(),
            'collaborators': []  # Track contributors
        }

        # Notify room about collaborative generation start
        socketio_instance.emit('collaborative_generation_started', {
            'session_id': session_id,
            'room_id': room_id,
            'type': generation_type,
            'started_by': 'collaborative',
            'prompt': prompt
        }, room=room_id)

        # Start generation in background thread
        thread = threading.Thread(
            target=run_collaborative_generation,
            args=(session_id, prompt, generation_type, provider, model, room_id, socketio_instance)
        )
        thread.daemon = True
        thread.start()

        logger.info(f"Collaborative generation started: {session_id} in room {room_id}")

    @socketio_instance.on('collaborative_contribution')
    def handle_collaborative_contribution(data):
        """Handle contributions to collaborative generation"""
        session_id = data.get('session_id')
        contribution = data.get('contribution')  # e.g., additional prompt text

        if not session_id or not contribution:
            socketio_instance.emit('error', {'error': 'Session ID and contribution required'})
            return

        if session_id not in active_generations:
            socketio_instance.emit('error', {'error': 'Generation session not found'})
            return

        generation = active_generations[session_id]

        # Add contributor (simplified - in real app, get from authenticated user)
        contributor = 'user_' + str(time.time())  # Placeholder
        if contributor not in generation['collaborators']:
            generation['collaborators'].append(contributor)

        # Update prompt with contribution (simple concatenation for now)
        generation['prompt'] = f"{generation.get('prompt', '')} {contribution}".strip()

        # Notify room about contribution
        socketio_instance.emit('contribution_added', {
            'session_id': session_id,
            'contributor': contributor,
            'contribution': contribution,
            'collaborators': generation['collaborators']
        }, room=generation['room_id'])

        logger.info(f"Contribution added to {session_id} by {contributor}")

# Register collaborative events after socketio is initialized

def run_collaborative_generation(session_id, prompt, generation_type, provider, model, room_id, socketio_instance):
    """Run collaborative AI generation"""
    try:
        generation = active_generations[session_id]
        generation['status'] = 'processing'
        generation['progress'] = 25
        generation['prompt'] = prompt

        # Emit progress update to room
        socketio_instance.emit('collaborative_generation_update', {
            'session_id': session_id,
            'room_id': room_id,
            'status': 'processing',
            'progress': 25,
            'message': 'Processing collaborative input...',
            'collaborators': generation['collaborators']
        }, room=room_id)

        # Simulate collaborative processing time
        time.sleep(2)

        # Call appropriate AI service method
        if generation_type == 'text':
            # Use local Ollama API for unrestricted text generation
            response = requests.post('http://localhost:11434/api/chat', json={
                'model': 'tinyllama',
                'messages': [{'role': 'user', 'content': generation['prompt']}],
                'stream': False
            })
            if response.status_code == 200:
                data_resp = response.json()
                output = data_resp['message']['content']
                filepath = None
            else:
                raise Exception(f"Ollama API error: {response.status_code} {response.text}")
        elif generation_type == 'image':
            output, filepath = ai_manager.generate_image(generation['prompt'], provider, model)
        elif generation_type == 'video':
            output, filepath = ai_manager.generate_video(generation['prompt'])
        elif generation_type == '3d':
            output, filepath = ai_manager.generate_3d(generation['prompt'])
        else:
            raise ValueError(f"Unsupported generation type: {generation_type}")

        generation['status'] = 'completed'
        generation['progress'] = 100
        generation['result'] = output
        generation['filepath'] = filepath

        # Emit completion to room
        socketio_instance.emit('collaborative_generation_complete', {
            'session_id': session_id,
            'room_id': room_id,
            'type': generation_type,
            'result': output,
            'filepath': filepath,
            'final_prompt': generation['prompt'],
            'collaborators': generation['collaborators']
        }, room=room_id)

        logger.info(f"Collaborative generation completed: {session_id}")

    except Exception as e:
        logger.error(f"Collaborative generation error for {session_id}: {e}")
        generation = active_generations.get(session_id, {})
        generation['status'] = 'error'
        generation['error'] = str(e)

        socketio_instance.emit('collaborative_generation_error', {
            'session_id': session_id,
            'room_id': room_id,
            'error': str(e)
        }, room=room_id)

    finally:
        # Clean up after some time
        def cleanup():
            time.sleep(300)  # Keep for 5 minutes
            active_generations.pop(session_id, None)
        threading.Timer(300, cleanup).start()

# Register collaborative events after socketio is initialized
register_collaborative_events(socketio)

if __name__ == '__main__':
    # Run the Flask app with SocketIO
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)