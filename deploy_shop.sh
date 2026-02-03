#!/bin/bash

# Deployment script for shop_app.py and ai_assistant.py (Flask applications)
# Replace the following variables with actual values:
# EC2_IP: The public IP address of the EC2 instance for the shop app
# KEY_FILE: Path to your SSH key pair file

EC2_IP="your-ec2-ip-here"
KEY_FILE="your-key-file.pem"

# Copy required files to the EC2 instance
scp -i $KEY_FILE shop_app.py requirements.txt printful_client.py security_service.py ai_assistant.py ai_services.py websocket_server.py auth_service.py ai_memory.json $EC2_IP:~/

# SSH into the instance, install dependencies, and start the service
ssh -i $KEY_FILE $EC2_IP << EOF
  # Install Python dependencies
  pip install -r requirements.txt

  # Start the Flask application using nohup
  nohup python shop_app.py &
  # Start the AI assistant service using nohup
  nohup python ai_assistant.py &
EOF

echo "Deployment of shop_app.py and ai_assistant.py completed."