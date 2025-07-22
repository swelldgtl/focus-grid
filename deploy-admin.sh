#!/bin/bash

# Admin App Deployment Script
echo "Building admin app..."

# Navigate to admin-app directory
cd admin-app

# Install dependencies
npm install

# Build the admin app
npm run build

echo "Build complete! Upload the 'admin-dist' folder to Netlify"
echo "Or connect this admin-app folder as root directory in Netlify"
