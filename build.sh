#!/bin/bash

echo "Installing server dependencies..."
npm install

cd client

echo "Installing client dependencies..."
npm install

echo "Building client..."
npm run build

echo "Build complete. Client files:"
ls -la dist/

cd ..

echo "Setting up output directory..." 