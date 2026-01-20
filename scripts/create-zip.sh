#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.."

# Output zip file name
ZIP_NAME="offline-recovery-tool-public.zip"

# Remove existing zip if present
rm -f "$ZIP_NAME"

# Create zip excluding unnecessary files
zip -r "$ZIP_NAME" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".gitignore" \
  -x ".DS_Store" \
  -x "*.log" \
  -x ".env*" \
  -x "dist/*" \
  -x ".husky/*" \
  -x ".vscode/*" \
  -x ".idea/*" \
  -x "coverage/*" \
  -x "*.zip"

echo "Created $ZIP_NAME"
