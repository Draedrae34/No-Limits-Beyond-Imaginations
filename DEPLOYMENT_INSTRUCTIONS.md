# Backend Services Deployment Instructions

This document provides instructions for deploying the backend services to AWS EC2 instances.

## Prerequisites

- Three EC2 instances running and accessible via SSH.
- SSH key pairs configured for access to the instances.
- Python 3 installed on the instances.
- pip installed on the instances.

## Services and Instances

- **Shop App (shop_app.py)**: Deploy to the first EC2 instance. Runs on port 5000.
- **AI Assistant (ai_assistant.py)**: Deploy to the second EC2 instance. Note: This file contains mock responses and may not function as a persistent service.
- **Security Service (security_service.py)**: Deploy to the third EC2 instance. Note: This is a class definition and may not run as a standalone service.

## Deployment Steps

1. Update each deployment script with the correct EC2 IP address and SSH key file path.
   - Edit `EC2_IP` and `KEY_FILE` variables in each script.

2. Run the deployment scripts from your local machine:
   - `./deploy_shop.sh` for the shop application.
   - `./deploy_ai.sh` for the AI assistant.
   - `./deploy_security.sh` for the security service.

3. Each script will:
   - Copy the necessary files to the EC2 instance via SCP.
   - Install dependencies using pip.
   - Start the service using nohup in the background.

## Post-Deployment

- Verify that the services are running by checking the processes on the instances.
- For the shop app, test endpoints like `http://<EC2_IP>:5000/api/products`.

## Summary of Deployed Services and Endpoints

- **Shop Application**: `http://<shop-ec2-ip>:5000`
  - Endpoints: /api/products, /api/orders, /api/ai/chat, /api/security/logs, etc.
- **AI Assistant**: `http://<ai-ec2-ip>:5001` (if configured to run as a service)
  - Note: May not have active endpoints.
- **Security Service**: `http://<security-ec2-ip>:5002` (if configured to run as a service)
  - Note: May not have active endpoints.

Ensure firewall rules allow traffic on the respective ports.