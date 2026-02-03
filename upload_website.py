#!/usr/bin/env python3
import ftplib
import os
from pathlib import Path

# FTP Configuration
FTP_HOST = 'ftp.knowlimitations-merch.com'
FTP_USER = 'knowlimitations-merch.com'  # Adjust if different
FTP_PASS = 'Draedrae24$'  # From user feedback

# Local directory to upload
LOCAL_DIR = '.'

# Remote directory (web root)
REMOTE_DIR = '/'

def upload_file(ftp, local_path, remote_path):
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)
    print(f'Uploaded {local_path} to {remote_path}')

def upload_dir(ftp, local_dir, remote_dir):
    for root, dirs, files in os.walk(local_dir):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', 'node_modules', 'android-app', 'ios-app', 'no-limits-theme', 'aws']]
        
        for file in files:
            local_path = os.path.join(root, file)
            remote_path = os.path.join(remote_dir, os.path.relpath(local_path, local_dir)).replace('\\', '/')
            
            # Create remote directory if needed
            remote_dir_path = os.path.dirname(remote_path)
            if remote_dir_path != remote_dir:
                try:
                    ftp.mkd(remote_dir_path)
                except ftplib.error_perm:
                    pass  # Directory may already exist
            
            upload_file(ftp, local_path, remote_path)

def main():
    try:
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.cwd(REMOTE_DIR)
        
        upload_dir(ftp, LOCAL_DIR, REMOTE_DIR)
        
        ftp.quit()
        print('Upload completed successfully!')
    except Exception as e:
        print(f'Upload failed: {e}')

if __name__ == '__main__':
    main()</content>
</xai:function_call name="write_to_file">
<parameter name="path">upload_website.py