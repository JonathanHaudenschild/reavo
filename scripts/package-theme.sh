#!/bin/bash

# Package script for Reavo theme
echo "Building Reavo theme package..."

# Run production build
npm run build

# Prepare package directory
rm -rf dist/reavo dist/reavo-theme.zip
mkdir -p dist

# Copy theme files to package
rsync -av \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  --exclude=.gitignore \
  --exclude=.DS_Store \
  --exclude=package-lock.json \
  --exclude=package.json \
  --exclude=scripts/package-theme.sh \
  --exclude=src \
  --exclude=tailwind.config.js \
  --exclude=postcss.config.js \
  --exclude=README.md \
  --exclude=.env* \
  . dist/reavo/

# Create zip package
cd dist
zip -r reavo-theme.zip reavo/

echo "Package created: dist/reavo-theme.zip"
