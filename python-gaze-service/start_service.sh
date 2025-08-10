#!/bin/bash

# GazeTracking Service Startup Script

echo "🚀 Starting GazeTracking Python Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Clone GazeTracking if not exists
if [ ! -d "GazeTracking" ]; then
    echo "👀 Cloning GazeTracking repository..."
    git clone https://github.com/antoinelame/GazeTracking.git
fi

# Install additional dependencies for GazeTracking
echo "🔍 Installing GazeTracking dependencies..."
pip install dlib

# Start the service
echo "🎯 Starting GazeTracking service on port 8001..."
python gaze_service.py
