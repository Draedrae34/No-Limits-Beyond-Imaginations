#!/bin/bash
set -euo pipefail

VERCEL_IGNORE=".vercelignore"
BACKUP_DIR="$(pwd)/deploy-archive"

echo "Creating deploy cleanup helper..."

mkdir -p "$BACKUP_DIR"

cat <<'EOF' > "$VERCEL_IGNORE"
Clothing_
Clothing_*.zip
Clothing_Ideas/
No_Limits_Clothing/
labeled_designs/
Music_Covers/
My_Story_Journey/
uploads/
node_modules/
*.zip
*.7z
*.png
*.jpg
*.mp3
*.mp4
.vercel/
docs/
reference/
destination*/
EOF

echo "Generated $VERCEL_IGNORE with heavy paths excluded."

echo "Archiving large directories for safekeeping..."
declare -a TO_ARCHIVE=("Clothing_" "labeled_designs" "Clothing_Ideas" "No_Limits_Clothing" "Music_Covers" "My_Story_Journey")
for dir in "${TO_ARCHIVE[@]}"; do
  if [ -d "$dir" ]; then
    tarball="$BACKUP_DIR/${dir}_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$tarball" "$dir"
    echo "Archived $dir -> $tarball"
  fi
done

echo "Cleaning git cache for ignored files..."
git rm -rf --cached --ignore-unmatch Clothing_*/ No_Limits_Clothing/ Clothing_Ideas/ labeled_designs/ Music_Covers/ My_Story_Journey/ uploads/ || true

echo "Deploy cleanup complete. Run 'npm run deploy' after ensuring your assets are backed up."
