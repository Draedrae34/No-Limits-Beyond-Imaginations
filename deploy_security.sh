#!/bin/bash

# Deployment script for security_service.py (Security service)
# Replace the following variables with actual values:
# EC2_IP: The public IP address of the EC2 instance for the security service
# KEY_FILE: Path to your SSH key pair file

EC2_IP="your-ec2-ip-here"
KEY_FILE="your-key-file.pem"

# Copy required files to the EC2 instance
scp -i $KEY_FILE security_service.py requirements.txt $EC2_IP:~/

# SSH into the instance, install dependencies, and start the service
ssh -i $KEY_FILE $EC2_IP << EOF
  # Install Python dependencies
  pip install -r requirements.txt

  # Start the security service using nohup
  nohup python security_service.py &
EOF

echo "Deployment of security_service.py completed."