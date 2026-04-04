#!/bin/bash

# Deployment script for ai_assistant.py (AI assistant service)
# Replace the following variables with actual values:
# EC2_IP: The public IP address of the EC2 instance for the AI assistant
# KEY_FILE: Path to your SSH key pair file

EC2_IP="your-ec2-ip-here"
KEY_FILE="your-key-file.pem"

# Copy required files to the EC2 instance
scp -i $KEY_FILE ai_assistant.py requirements.txt $EC2_IP:~/

# SSH into the instance, install dependencies, and start the service
ssh -i $KEY_FILE $EC2_IP << EOF
  # Install Python dependencies
  pip install -r requirements.txt

  # Start the AI assistant service using nohup
  nohup python ai_assistant.py &
EOF

echo "Deployment of ai_assistant.py completed."