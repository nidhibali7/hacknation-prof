#!/usr/bin/env python3
"""
GazeTracking Backend Service
Processes video frames from the browser and returns gaze tracking data
"""

import asyncio
import base64
import json
import logging
from io import BytesIO
from typing import Dict, Any, Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Clone and install GazeTracking
import subprocess
import sys
import os

def install_gaze_tracking():
    """Install GazeTracking library if not available"""
    try:
        from gaze_tracking import GazeTracking
        return True
    except ImportError:
        print("Installing GazeTracking library...")
        try:
            # Clone the repository
            if not os.path.exists("GazeTracking"):
                subprocess.run([
                    "git", "clone", 
                    "https://github.com/antoinelame/GazeTracking.git"
                ], check=True)
            
            # Add to Python path
            sys.path.insert(0, os.path.abspath("GazeTracking"))
            from gaze_tracking import GazeTracking
            return True
        except Exception as e:
            print(f"Failed to install GazeTracking: {e}")
            return False

# Install GazeTracking if needed
if not install_gaze_tracking():
    print("ERROR: Could not install GazeTracking library")
    sys.exit(1)

from gaze_tracking import GazeTracking

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="GazeTracking Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GazeProcessor:
    """Handles gaze tracking processing"""
    
    def __init__(self):
        self.gaze = GazeTracking()
        logger.info("GazeTracking initialized")
    
    def process_frame(self, frame_data: str) -> Dict[str, Any]:
        """
        Process a base64 encoded frame and return gaze data
        
        Args:
            frame_data: Base64 encoded image data
            
        Returns:
            Dictionary containing gaze tracking results
        """
        try:
            # Decode base64 image
            image_data = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
            image = Image.open(BytesIO(image_data))
            
            # Convert PIL image to OpenCV format
            frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Process frame with GazeTracking
            self.gaze.refresh(frame)
            
            # Extract gaze data
            gaze_data = {
                "timestamp": asyncio.get_event_loop().time(),
                "pupil_left": self.gaze.pupil_left_coords(),
                "pupil_right": self.gaze.pupil_right_coords(),
                "horizontal_ratio": self.gaze.horizontal_ratio(),
                "vertical_ratio": self.gaze.vertical_ratio(),
                "is_left": self.gaze.is_left(),
                "is_right": self.gaze.is_right(),
                "is_center": self.gaze.is_center(),
                "is_blinking": self.gaze.is_blinking(),
                "frame_processed": True
            }
            
            # Calculate attention score based on gaze direction
            attention_score = self.calculate_attention_score(gaze_data)
            gaze_data["attention_score"] = attention_score
            
            return gaze_data
            
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return {
                "error": str(e),
                "frame_processed": False,
                "timestamp": asyncio.get_event_loop().time()
            }
    
    def calculate_attention_score(self, gaze_data: Dict[str, Any]) -> float:
        """
        Calculate attention score based on gaze direction
        
        Args:
            gaze_data: Gaze tracking results
            
        Returns:
            Attention score between 0.0 and 1.0
        """
        if gaze_data.get("is_blinking", False):
            return 0.3  # Lower attention when blinking
        
        if gaze_data.get("is_center", False):
            return 1.0  # High attention when looking at center
        
        # Calculate attention based on horizontal and vertical ratios
        h_ratio = gaze_data.get("horizontal_ratio", 0.5)
        v_ratio = gaze_data.get("vertical_ratio", 0.5)
        
        if h_ratio is None or v_ratio is None:
            return 0.5  # Default attention when ratios unavailable
        
        # Distance from center (0.5, 0.5)
        center_distance = np.sqrt((h_ratio - 0.5)**2 + (v_ratio - 0.5)**2)
        
        # Convert distance to attention score (closer to center = higher attention)
        attention = max(0.0, 1.0 - (center_distance * 2))
        
        return round(attention, 2)

# Global gaze processor
gaze_processor = GazeProcessor()

@app.websocket("/ws/gaze")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time gaze tracking"""
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive frame data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "frame":
                # Process the frame
                frame_data = message.get("data")
                if frame_data:
                    gaze_result = gaze_processor.process_frame(frame_data)
                    
                    # Send results back to client
                    response = {
                        "type": "gaze_data",
                        "data": gaze_result
                    }
                    await websocket.send_text(json.dumps(response))
                    
            elif message.get("type") == "ping":
                # Respond to ping with pong
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "gaze-tracking",
        "gaze_tracking_available": True
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "GazeTracking Service",
        "version": "1.0.0",
        "endpoints": {
            "websocket": "/ws/gaze",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting GazeTracking service...")
    uvicorn.run(
        "gaze_service:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
