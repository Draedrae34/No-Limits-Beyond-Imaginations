import jwt
import pyotp
import bcrypt
import logging
from datetime import datetime, timedelta
from functools import wraps
import os
from flask import request, jsonify, g
import json

class AuthService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.jwt_secret = os.getenv('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production')
        self.jwt_algorithm = 'HS256'
        self.users_file = 'users.json'
        self.audit_log_file = 'audit.log'

        # Initialize users if file doesn't exist
        if not os.path.exists(self.users_file):
            self._initialize_users()

        # Load users
        self.users = self._load_users()

    def _initialize_users(self):
        """Initialize with default owner user"""
        default_user = {
            'username': 'owner',
            'password_hash': bcrypt.hashpw('NoLimitationQuantum2025'.encode(), bcrypt.gensalt()).decode(),
            'role': 'owner',
            'mfa_secret': pyotp.random_base32(),
            'enabled': True,
            'created_at': datetime.utcnow().isoformat()
        }
        with open(self.users_file, 'w') as f:
            json.dump({'users': [default_user]}, f, indent=2)

    def _load_users(self):
        """Load users from file"""
        try:
            with open(self.users_file, 'r') as f:
                data = json.load(f)
                return data.get('users', [])
        except Exception as e:
            self.logger.error(f"Error loading users: {e}")
            return []

    def _save_users(self):
        """Save users to file"""
        try:
            with open(self.users_file, 'w') as f:
                json.dump({'users': self.users}, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving users: {e}")

    def _audit_log(self, event_type, username=None, ip=None, user_agent=None, details=None):
        """Log authentication events"""
        timestamp = datetime.utcnow().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'event_type': event_type,
            'username': username,
            'ip': ip or request.remote_addr if request else 'unknown',
            'user_agent': user_agent or request.headers.get('User-Agent') if request else 'unknown',
            'details': details or {}
        }

        try:
            with open(self.audit_log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            self.logger.error(f"Error writing audit log: {e}")

        self.logger.info(f"AUDIT: {event_type} - {username or 'unknown'} - {ip or 'unknown'}")

    def authenticate_user(self, username, password, mfa_code=None):
        """Authenticate user with password and optional MFA"""
        user = self._get_user_by_username(username)
        if not user or not user.get('enabled', False):
            self._audit_log('LOGIN_FAILED', username, details={'reason': 'user_not_found_or_disabled'})
            return False, "Invalid credentials"

        if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            self._audit_log('LOGIN_FAILED', username, details={'reason': 'invalid_password'})
            return False, "Invalid credentials"

        # Check MFA if enabled
        if user.get('mfa_secret') and user.get('role') != 'owner':
            if not mfa_code:
                self._audit_log('LOGIN_MFA_REQUIRED', username)
                return False, "MFA code required"

            totp = pyotp.TOTP(user['mfa_secret'])
            if not totp.verify(mfa_code):
                self._audit_log('LOGIN_FAILED', username, details={'reason': 'invalid_mfa'})
                return False, "Invalid MFA code"

        self._audit_log('LOGIN_SUCCESS', username)
        return True, user

    def generate_token(self, user):
        """Generate JWT token for authenticated user"""
        payload = {
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
            'iat': datetime.utcnow(),
            'iss': 'NoLimitsClothing'
        }
        token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        return token

    def verify_token(self, token):
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            username = payload.get('username')
            user = self._get_user_by_username(username)
            if not user or not user.get('enabled', False):
                return False, None
            return True, user
        except jwt.ExpiredSignatureError:
            return False, None
        except jwt.InvalidTokenError:
            return False, None

    def _get_user_by_username(self, username):
        """Get user by username"""
        for user in self.users:
            if user['username'] == username:
                return user
        return None

    def get_mfa_secret(self, username):
        """Get MFA secret for user (for QR code generation)"""
        user = self._get_user_by_username(username)
        if user and user.get('mfa_secret'):
            return user['mfa_secret']
        return None

    def setup_mfa(self, username):
        """Setup MFA for user"""
        user = self._get_user_by_username(username)
        if user:
            user['mfa_secret'] = pyotp.random_base32()
            self._save_users()
            self._audit_log('MFA_SETUP', username)
            return user['mfa_secret']
        return None

    def create_customer(self, username, password, email=None):
        """Create a new customer user"""
        if self._get_user_by_username(username):
            return False, "Username already exists"

        customer_user = {
            'username': username,
            'password_hash': bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
            'role': 'customer',
            'email': email,
            'mfa_secret': None,  # Customers don't need MFA by default
            'enabled': True,
            'created_at': datetime.utcnow().isoformat()
        }
        self.users.append(customer_user)
        self._save_users()
        self._audit_log('CUSTOMER_CREATED', username, details={'email': email})
        return True, customer_user

    def has_role(self, user, required_role):
        """Check if user has required role"""
        user_role = user.get('role', 'customer')
        role_hierarchy = {
            'customer': 1,
            'user': 2,
            'admin': 3,
            'owner': 4
        }
        return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)

    def get_audit_logs(self, limit=100):
        """Get recent audit logs"""
        try:
            with open(self.audit_log_file, 'r') as f:
                lines = f.readlines()[-limit:]
                logs = [json.loads(line.strip()) for line in lines]
                return logs
        except Exception as e:
            self.logger.error(f"Error reading audit logs: {e}")
            return []

# Global auth service instance
auth_service = AuthService()

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            auth_service._audit_log('ACCESS_DENIED', ip=request.remote_addr, details={'reason': 'no_token'})
            return jsonify({'error': 'Token is missing'}), 401

        valid, user = auth_service.verify_token(token)
        if not valid:
            auth_service._audit_log('ACCESS_DENIED', ip=request.remote_addr, details={'reason': 'invalid_token'})
            return jsonify({'error': 'Token is invalid'}), 401

        g.user = user
        return f(*args, **kwargs)
    return decorated_function

def owner_required(f):
    """Decorator to require owner role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user'):
            return jsonify({'error': 'Authentication required'}), 401

        if not auth_service.has_role(g.user, 'owner'):
            auth_service._audit_log('ACCESS_DENIED', g.user.get('username'), details={'reason': 'insufficient_role', 'required': 'owner'})
            return jsonify({'error': 'Owner access required'}), 403

        return f(*args, **kwargs)
    return decorated_function