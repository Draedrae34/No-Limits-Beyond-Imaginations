#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from auth_service import auth_service
from flask import Flask, g
import json

def test_auth_service():
    """Test the authentication service directly"""
    print("Testing Auth Service...")

    # Test user authentication
    username = 'owner'
    password = 'NoLimitationQuantum2025'

    print(f"Testing login for user: {username}")
    success, result = auth_service.authenticate_user(username, password)
    if success:
        print("✓ Authentication successful")
        print(f"  User: {result['username']}")
        print(f"  Role: {result['role']}")

        # Test token generation
        print("Testing JWT token generation...")
        token = auth_service.generate_token(result)
        print(f"✓ Token generated: {token[:50]}...")

        # Test token verification
        print("Testing JWT token verification...")
        valid, user = auth_service.verify_token(token)
        if valid:
            print("✓ Token verification successful")
            print(f"  Verified user: {user['username']}")
            print(f"  Verified role: {user['role']}")
        else:
            print("✗ Token verification failed")

        # Test role checking
        print("Testing role checking...")
        if auth_service.has_role(user, 'owner'):
            print("✓ Owner role confirmed")
        else:
            print("✗ Owner role check failed")

    else:
        print("✗ Authentication failed")
        print(f"  Error: {result}")

    # Test invalid credentials
    print("\nTesting invalid credentials...")
    success, result = auth_service.authenticate_user('invalid', 'invalid')
    if not success:
        print("✓ Invalid credentials correctly rejected")
    else:
        print("✗ Invalid credentials were accepted")

def test_ai_endpoints():
    """Test AI endpoints logic (mock)"""
    print("\nTesting AI Endpoints (mock)...")

    # Since we can't run the server, we'll test the logic directly
    # The AI endpoints use @owner_required decorator, so we need to simulate g.user

    app = Flask(__name__)

    with app.app_context():
        # Simulate authenticated owner user
        g.user = {'username': 'owner', 'role': 'owner'}

        # Test if owner_required would pass
        from auth_service import owner_required

        @owner_required
        def mock_ai_endpoint():
            return {"response": "Mock AI response"}

        try:
            result = mock_ai_endpoint()
            print("✓ Owner access to AI endpoint granted")
            print(f"  Response: {result}")
        except Exception as e:
            print(f"✗ Owner access failed: {e}")

        # Test with non-owner user
        g.user = {'username': 'user', 'role': 'user'}

        try:
            result = mock_ai_endpoint()
            print("✗ Non-owner access was allowed (should fail)")
        except Exception as e:
            print("✓ Non-owner access correctly denied")
            print(f"  Error: {e}")

if __name__ == '__main__':
    test_auth_service()
    test_ai_endpoints()
    print("\nTest completed.")