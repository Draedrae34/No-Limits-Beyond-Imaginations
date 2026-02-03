#!/bin/bash

# AWS Infrastructure Setup Script for NoLimitsClothing Production Deployment
# This script creates VPC, EC2 instances, S3 bucket, CloudFront, and necessary security groups and IAM roles.

# Set variables
REGION="us-east-1"
VPC_CIDR="10.0.0.0/16"
PUBLIC_SUBNET_CIDR="10.0.1.0/24"
PRIVATE_SUBNET_CIDR="10.0.2.0/24"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2 in us-east-1 (update if needed)
INSTANCE_TYPE="t3.micro"
KEY_NAME="nolimits-key"  # Assume key pair exists or create it
BUCKET_NAME="nolimitsclothing-static-site"
DOMAIN_NAME="nolimitsclothing.com"  # Placeholder

# Export AWS CLI path
export PATH="$HOME/.local/bin:$PATH"

# Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --region $REGION --query 'Vpc.VpcId' --output text)
echo "VPC created: $VPC_ID"

# Create subnets
echo "Creating public subnet..."
PUBLIC_SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $PUBLIC_SUBNET_CIDR --availability-zone ${REGION}a --query 'Subnet.SubnetId' --output text)
echo "Public subnet created: $PUBLIC_SUBNET_ID"

echo "Creating private subnet..."
PRIVATE_SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $PRIVATE_SUBNET_CIDR --availability-zone ${REGION}a --query 'Subnet.SubnetId' --output text)
echo "Private subnet created: $PRIVATE_SUBNET_ID"

# Create Internet Gateway
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
echo "IGW created and attached: $IGW_ID"

# Create route table
echo "Creating route table..."
RTB_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RTB_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_ID --route-table-id $RTB_ID
echo "Route table created: $RTB_ID"

# Create security groups
echo "Creating security groups..."
# Web SG for Flask
WEB_SG_ID=$(aws ec2 create-security-group --group-name nolimits-web-sg --description "Security group for web servers" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $WEB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $WEB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $WEB_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0  # For SSH, restrict in production
echo "Web SG created: $WEB_SG_ID"

# AI SG
AI_SG_ID=$(aws ec2 create-security-group --group-name nolimits-ai-sg --description "Security group for AI service" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $AI_SG_ID --protocol tcp --port 5001 --source-group $WEB_SG_ID  # Assume port 5001 for AI
aws ec2 authorize-security-group-ingress --group-id $AI_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
echo "AI SG created: $AI_SG_ID"

# Security SG
SEC_SG_ID=$(aws ec2 create-security-group --group-name nolimits-sec-sg --description "Security group for security service" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SEC_SG_ID --protocol tcp --port 5002 --source-group $WEB_SG_ID  # Assume port 5002
aws ec2 authorize-security-group-ingress --group-id $SEC_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
echo "Security SG created: $SEC_SG_ID"

# Create IAM role for EC2
echo "Creating IAM role for EC2..."
aws iam create-role --role-name nolimits-ec2-role --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'
aws iam attach-role-policy --role-name nolimits-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
aws iam attach-role-policy --role-name nolimits-ec2-role --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
INSTANCE_PROFILE=$(aws iam create-instance-profile --instance-profile-name nolimits-ec2-profile --query 'InstanceProfile.InstanceProfileName' --output text)
aws iam add-role-to-instance-profile --instance-profile-name $INSTANCE_PROFILE --role-name nolimits-ec2-role
echo "IAM role and instance profile created."

# Launch EC2 instances
echo "Launching EC2 instances..."
# Flask app
FLASK_INSTANCE_ID=$(aws ec2 run-instances --image-id $AMI_ID --count 1 --instance-type $INSTANCE_TYPE --key-name $KEY_NAME --security-group-ids $WEB_SG_ID --subnet-id $PUBLIC_SUBNET_ID --associate-public-ip-address --iam-instance-profile Name=$INSTANCE_PROFILE --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=NoLimits-Flask}]' --query 'Instances[0].InstanceId' --output text)
echo "Flask instance launched: $FLASK_INSTANCE_ID"

# AI assistant
AI_INSTANCE_ID=$(aws ec2 run-instances --image-id $AMI_ID --count 1 --instance-type $INSTANCE_TYPE --key-name $KEY_NAME --security-group-ids $AI_SG_ID --subnet-id $PRIVATE_SUBNET_ID --iam-instance-profile Name=$INSTANCE_PROFILE --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=NoLimits-AI}]' --query 'Instances[0].InstanceId' --output text)
echo "AI instance launched: $AI_INSTANCE_ID"

# Security service
SEC_INSTANCE_ID=$(aws ec2 run-instances --image-id $AMI_ID --count 1 --instance-type $INSTANCE_TYPE --key-name $KEY_NAME --security-group-ids $SEC_SG_ID --subnet-id $PRIVATE_SUBNET_ID --iam-instance-profile Name=$INSTANCE_PROFILE --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=NoLimits-Security}]' --query 'Instances[0].InstanceId' --output text)
echo "Security instance launched: $SEC_INSTANCE_ID"

# Create S3 bucket
echo "Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document error.html
echo "S3 bucket created: $BUCKET_NAME"

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
DISTRIBUTION_CONFIG=$(cat <<EOF
{
  "CallerReference": "$(date +%s)",
  "Comment": "NoLimitsClothing static site",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html"
}
EOF
)

DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG" --query 'Distribution.Id' --output text)
echo "CloudFront distribution created: $DISTRIBUTION_ID"

echo "Infrastructure setup complete."
echo "Summary:"
echo "- VPC: $VPC_ID"
echo "- Public Subnet: $PUBLIC_SUBNET_ID"
echo "- Private Subnet: $PRIVATE_SUBNET_ID"
echo "- IGW: $IGW_ID"
echo "- Route Table: $RTB_ID"
echo "- Security Groups: Web($WEB_SG_ID), AI($AI_SG_ID), Security($SEC_SG_ID)"
echo "- IAM Role: nolimits-ec2-role"
echo "- EC2 Instances: Flask($FLASK_INSTANCE_ID), AI($AI_INSTANCE_ID), Security($SEC_INSTANCE_ID)"
echo "- S3 Bucket: $BUCKET_NAME"
echo "- CloudFront Distribution: $DISTRIBUTION_ID"