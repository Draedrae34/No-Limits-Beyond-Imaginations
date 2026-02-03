# Deployment Guide for IONOS - FileZilla

## FileZilla Installation (Manual)

Since I can't install software, please do this manually:

### Option 1: Terminal Install (run in terminal)
```bash
sudo apt update && sudo apt install filezilla
```
Enter your password when prompted.

### Option 2: Download from Website
1. Go to https://filezilla-project.org/download.php
2. Download FileZilla Client for Linux
3. Install using your package manager

## Your Saved FileZilla Credentials:
- **Host:** access-5019238074.webspace-host.com
- **Port:** 22 (SFTP)
- **Username:** a2040609
- **Password:** [Enter your IONOS password]

## Deployment Steps:

1. **Open FileZilla**

2. **Quick Connect:**
   - Click the "Quick Connect" bar at top
   - Enter: sftp://access-5019238074.webspace-host.com
   - Username: a2040609
   - Password: [your IONOS password]
   - Port: 22
   - Click "Quickconnect"

3. **Upload Files:**
   - **Local site (left):** Navigate to /home/aundrae/Desktop/NoLimitsClothing/
   - **Remote site (right):** Navigate to /htdocs or /httpdocs
   - Select all these files and drag to right:
     - index.html
     - remembrance.html
     - personal.html
     - workshop.html
     - script.js
     - styles.css
     - about.html
     - album.html
     - ladies-shoes.html

4. **Verify:**
   - Visit www.knowlimitations-merch.com
   - Test all pages work
