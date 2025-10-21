#!/bin/bash

# Package script for Reavo theme
echo "Building Reavo theme package..."

# Run production build
npm run build

# Create package directory
mkdir -p dist

# Copy theme files to package
rsync -av --exclude=node_modules --exclude=dist --exclude=.git . dist/reavo/

# Create zip package
cd dist
zip -r reavo-theme.zip reavo/

echo "Package created: dist/reavo-theme.zip"