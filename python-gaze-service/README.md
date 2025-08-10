# Python GazeTracking Service

This service integrates the [GazeTracking library](https://github.com/antoinelame/GazeTracking) with your Next.js application to provide accurate eye tracking and gaze detection.

## Architecture

- **Python Backend**: FastAPI server with WebSocket support
- **GazeTracking Library**: Real-time eye tracking using OpenCV and dlib
- **WebSocket Communication**: Real-time frame streaming between browser and Python service
- **Frontend Integration**: Updated CameraAttention component with GazeClient

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd python-gaze-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install dlib (required for GazeTracking)
pip install dlib
```

### 2. Install GazeTracking Library

The service will automatically clone and install the GazeTracking library when first run, but you can also do it manually:

```bash
git clone https://github.com/antoinelame/GazeTracking.git
```

### 3. Start the Python Service

Option A - Use the startup script:
```bash
./start_service.sh
```

Option B - Manual start:
```bash
source venv/bin/activate
python gaze_service.py
```

The service will start on `http://localhost:8001`

### 4. Start Your Next.js Application

In a separate terminal:
```bash
cd ..
npm run dev
```

Your Next.js app will run on `http://localhost:3000` and automatically connect to the Python GazeTracking service.

## How It Works

1. **Frame Capture**: The frontend captures video frames from the webcam at 10 FPS
2. **WebSocket Streaming**: Frames are sent as base64-encoded images to the Python service
3. **Gaze Processing**: The Python service uses GazeTracking to analyze each frame
4. **Results Streaming**: Gaze data is sent back to the frontend in real-time
5. **Integration**: The frontend converts Python gaze data to the existing GazeData format

## API Endpoints

- `GET /`: Service information
- `GET /health`: Health check
- `WebSocket /ws/gaze`: Real-time gaze tracking WebSocket

## Gaze Data Format

The Python service returns:

```typescript
interface PythonGazeData {
  timestamp: number;
  pupil_left: [number, number] | null;
  pupil_right: [number, number] | null;
  horizontal_ratio: number | null;  // 0.0 (right) to 1.0 (left)
  vertical_ratio: number | null;    // 0.0 (top) to 1.0 (bottom)
  is_left: boolean;
  is_right: boolean;
  is_center: boolean;
  is_blinking: boolean;
  attention_score: number;          // 0.0 to 1.0
  frame_processed: boolean;
}
```

## Troubleshooting

### Service Won't Start
- Ensure Python 3.7+ is installed
- Check that all dependencies are installed: `pip list`
- Verify dlib installation: `python -c "import dlib; print('dlib OK')"`

### WebSocket Connection Issues
- Ensure the Python service is running on port 8001
- Check firewall settings
- Verify CORS configuration in the Python service

### Poor Gaze Tracking Performance
- Ensure good lighting conditions
- Position camera at eye level
- Minimize head movement during calibration
- Check that your webcam supports the required resolution

### Webcam Access Issues
- Grant camera permissions in your browser
- Ensure no other applications are using the webcam
- Try refreshing the browser page

## Performance Optimization

- **Frame Rate**: Adjust the frame sending interval in `CameraAttention.tsx` (currently 100ms)
- **Image Quality**: Modify JPEG quality in `captureVideoFrame()` function
- **Processing Queue**: The service queues frames to prevent overwhelming the backend

## Development

To modify the gaze tracking logic:

1. Edit `gaze_service.py` 
2. Restart the Python service
3. The frontend will automatically reconnect

## Dependencies

### Python
- fastapi==0.104.1
- uvicorn==0.24.0
- websockets==12.0
- opencv-python==4.8.1.78
- numpy==1.24.3
- Pillow==10.1.0
- dlib (for face detection)

### Frontend
- Custom GazeClient utility (`lib/gazeClient.ts`)
- Updated CameraAttention component
- WebSocket support

## Security Notes

- The service only accepts connections from localhost by default
- No gaze data is stored or logged
- All processing happens locally on your machine
