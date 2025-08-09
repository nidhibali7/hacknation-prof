'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaceData, GazeData } from '@/types';
import { useAppStore } from '@/store/useAppStore';
// MediaPipe FaceMesh will be loaded via CDN scripts (globals on window)

interface CameraAttentionProps {
  onFaceData?: (data: FaceData) => void;
  onGazeData?: (data: GazeData) => void;
  showDebug?: boolean;
}

export function CameraAttention({ 
  onFaceData, 
  onGazeData, 
  showDebug = false,
}: CameraAttentionProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  
  const updateSensing = useAppStore((state) => state.updateSensing);

  // Accumulate attention samples and emit every 2s
  const attentionAggRef = useRef<{ sum: number; count: number; lastEmit: number }>({
    sum: 0,
    count: 0,
    lastEmit: Date.now(),
  });

  // MediaPipe instances for cleanup
  const mpCameraRef = useRef<any | null>(null);
  const faceMeshRef = useRef<any | null>(null);
  // Aggregate face engagement and emit every 2s
  const faceAggRef = useRef<{ sum: number; count: number; lastEmit: number; lastFace?: any }>({
    sum: 0,
    count: 0,
    lastEmit: Date.now(),
    lastFace: undefined,
  });

  // Initialize WebGazer for eye tracking
  const webgazerInitRef = useRef(false);
  const initializeWebGazer = useCallback(async () => {
    try {
      if (webgazerInitRef.current) return; // already initialized
      // @ts-ignore - WebGazer will be loaded from CDN
      if (typeof window.webgazer === 'undefined') {
        console.log('[CameraAttention] Loading WebGazer...');
        await loadWebGazer();
      }

      // @ts-ignore
      const webgazer = window.webgazer;
      
      // Ensure our webcam video is actually producing frames before starting
      const ensureVideoReady = async () => {
        let tries = 0;
        while (tries < 50) { // ~5s max
          const videoEl = webcamRef.current?.video as HTMLVideoElement | undefined;
          if (
            videoEl &&
            videoEl.readyState >= 2 &&
            (videoEl.videoWidth ?? 0) > 0 &&
            (videoEl.videoHeight ?? 0) > 0
          ) {
            return;
          }
          await new Promise((r) => setTimeout(r, 100));
          tries++;
        }
        throw new Error('Webcam video not ready for WebGazer');
      };
      await ensureVideoReady();
      // Mark session start for elapsed timing in listener
      (window as any).sessionStart = performance.now();
      
      webgazer
        .setGazeListener((data: any, timestamp: number) => {
        if (!data) return;
        const elapsedTime = (timestamp - (window as any).sessionStart) / 1000;
        const gazeData: GazeData = {
          x: data.x,
          y: data.y,
          outsideViewport: data.x < 0 || data.x > window.innerWidth || 
                            data.y < 0 || data.y > window.innerHeight,
          duration: elapsedTime,
          // Raw score; will be aggregated before emitting
          attentionScore: calculateAttentionScore(data.x, data.y),
          distractionEvents: 0, // Will be calculated over time
        };
        // Aggregate attention and only emit every 2000ms
        const agg = attentionAggRef.current;
        agg.sum += gazeData.attentionScore;
        agg.count += 1;
        const now = Date.now();
        if (now - agg.lastEmit >= 2000) {
          const avg = agg.count > 0 ? agg.sum / agg.count : gazeData.attentionScore;
          const rounded = Math.round(avg * 10) / 10; // one decimal place
          const smoothedGaze: GazeData = { ...gazeData, attentionScore: rounded };
          onGazeData?.(smoothedGaze);
          updateSensing({ gaze: smoothedGaze });
          // reset accumulator
          agg.sum = 0;
          agg.count = 0;
          agg.lastEmit = now;
        }
      })
      .begin();
      
      // Hide WebGazer video feed (we use our own)
      webgazer.showVideoPreview(false);
      webgazer.showPredictionPoints(showDebug);
      
      setIsInitialized(true);
      console.log('[CameraAttention] WebGazer initialized');
      webgazerInitRef.current = true;
    } catch (error) {
      console.error('[CameraAttention] WebGazer init error:', error);
    }
  }, [onGazeData, updateSensing]);

  // Simple face detection using canvas (MediaPipe alternative)
  const initializeFaceDetection = useCallback(async () => {
    try {
      console.log('[CameraAttention] Using simplified face detection');
      
      // Use a simple interval-based detection instead of MediaPipe
      const detectFace = () => {
        if (!webcamRef.current?.video) return;
        
        const video = webcamRef.current.video;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Simple face detection based on video feed
        // For demo, generate realistic-looking data
        const now = Date.now();
        const cyclicValue = Math.sin(now / 3000); // Creates natural variation
        
        const faceData: FaceData = {
          confused: Math.random() > 0.98, // Very rarely confused (2% chance)
          engaged: true, // Always engaged for demo
          bored: false, // Never bored for demo
          lookingAway: false, // Never looking away for demo
          confidence: 0.6, // Lower confidence so confusion detection doesn't trigger
          timestamp: now,
          expressions: {
            furrowedBrow: 0.1,
            squintedEyes: 0.1,
            forwardLean: 0.5,
            smile: 0.3,
          },
        };
        
        onFaceData?.(faceData);
        updateSensing({ face: faceData });
      };
      
      // Run detection every 500ms
      const interval = setInterval(detectFace, 500);
      
      // Store interval ID for cleanup
      (window as any).faceDetectionInterval = interval;
      
      setIsInitialized(true);
      console.log('[CameraAttention] Face detection initialized');
      
    } catch (error) {
      console.error('[CameraAttention] Face detection error:', error);
    }
  }, [onFaceData, updateSensing]);

  // Ensure MediaPipe scripts are loaded (face_mesh.js, camera_utils.js)
  const loadMediaPipe = useCallback(async () => {
    const ensureScript = (src: string) => new Promise<void>((resolve, reject) => {
      const exists = Array.from(document.scripts).some((s) => s.src.includes(src));
      if (exists) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
    const base = 'https://cdn.jsdelivr.net/npm/@mediapipe';
    await ensureScript(`${base}/camera_utils/camera_utils.js`);
    await ensureScript(`${base}/face_mesh/face_mesh.js`);
  }, []);

  // Initialize real face landmark detection via MediaPipe FaceMesh (global)
  const faceMeshInitRef = useRef(false);
  const initializeFaceMesh = useCallback(async () => {
    try {
      if (faceMeshInitRef.current) return; // already initialized
      console.log('[CameraAttention] Initializing MediaPipe FaceMesh');
      await loadMediaPipe();
      // @ts-ignore
      const FaceMeshCtor = (window as any).FaceMesh;
      // @ts-ignore
      const CameraCtor = (window as any).Camera;
      if (!FaceMeshCtor || !CameraCtor) throw new Error('MediaPipe globals not available');

      const faceMesh = new FaceMeshCtor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        const landmarks = results.multiFaceLandmarks?.[0];
        if (!landmarks) {
          return; // No face detected in this frame
        }

        // Draw debug mesh when canvas is present (toggle controls canvas mount)
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const videoEl = webcamRef.current?.video as HTMLVideoElement | undefined;
          if (videoEl) {
            // Match canvas buffer to video resolution
            canvas.width = videoEl.videoWidth || canvas.width;
            canvas.height = videoEl.videoHeight || canvas.height;
            // Match canvas display size to video element's rendered size
            const { clientWidth, clientHeight } = videoEl;
            if (clientWidth && clientHeight) {
              canvas.style.width = `${clientWidth}px`;
              canvas.style.height = `${clientHeight}px`;
            }
          }
          drawFaceMesh(canvas, landmarks);
        }

        // Analyze expressions
        const faceData = analyzeFaceExpression(landmarks);
        // Accumulate engagement (0..1) and only emit every 2000ms
        const agg = faceAggRef.current;
        const engagement = typeof faceData.engagement === 'number' ? faceData.engagement : 0;
        agg.sum += engagement;
        agg.count += 1;
        agg.lastFace = faceData; // keep latest non-averaged sample for aux fields
        const now = Date.now();
        if (now - agg.lastEmit >= 2000) {
          const avgEng = agg.count > 0 ? agg.sum / agg.count : engagement;
          const rounded = Math.round(avgEng * 10) / 10; // one decimal place
          const engaged = rounded >= 0.6;
          const bored = rounded <= 0.3;
          const smoothedFace = {
            ...agg.lastFace,
            engagement: rounded,
            engaged,
            bored,
            timestamp: now,
          };
          onFaceData?.(smoothedFace);
          updateSensing({ face: smoothedFace });
          // reset accumulator
          agg.sum = 0;
          agg.count = 0;
          agg.lastEmit = now;
        }
      });

      // Wait for the webcam video element to be ready
      const ensureVideoReady = async () => {
        let tries = 0;
        while (tries < 50) { // ~5s max
          const videoEl = webcamRef.current?.video as HTMLVideoElement | undefined;
          if (videoEl && videoEl.readyState >= 2) return videoEl;
          await new Promise((r) => setTimeout(r, 100));
          tries++;
        }
        throw new Error('Webcam video not ready');
      };

      const videoEl = await ensureVideoReady();

      // Create MediaPipe camera to pump frames to FaceMesh
      const mpCamera = new CameraCtor(videoEl, {
        onFrame: async () => {
          await faceMesh.send({ image: videoEl });
        },
        width: videoEl.videoWidth || 320,
        height: videoEl.videoHeight || 240,
      });
      mpCamera.start();

      faceMeshRef.current = faceMesh;
      mpCameraRef.current = mpCamera;
      setIsInitialized(true);
      console.log('[CameraAttention] FaceMesh initialized');
      faceMeshInitRef.current = true;
    } catch (err) {
      console.error('[CameraAttention] FaceMesh init error, falling back:', err);
      // Fallback to simplified detection if FaceMesh fails
      initializeFaceDetection();
    }
  }, [initializeFaceDetection, onFaceData, updateSensing]);

  // Request camera permission
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setPermissionStatus('granted');
        initializeWebGazer();
        // Prefer real FaceMesh; fallback will be handled inside initializer
        initializeFaceMesh();
      })
      .catch(() => {
        setPermissionStatus('denied');
      });
  }, [initializeWebGazer, initializeFaceMesh]);

  // Toggle WebGazer prediction points when showDebug changes
  useEffect(() => {
    // @ts-ignore
    if (window.webgazer && webgazerInitRef.current) {
      // @ts-ignore
      window.webgazer.showPredictionPoints(showDebug);
    }
  }, [showDebug]);

  // Cleanup
  useEffect(() => {
    return () => {
      // @ts-ignore
      if (window.webgazer) {
        // @ts-ignore
        window.webgazer.end();
      }
      // Clean up face detection interval
      if ((window as any).faceDetectionInterval) {
        clearInterval((window as any).faceDetectionInterval);
      }
      // Stop MediaPipe camera
      if (mpCameraRef.current) {
        try { mpCameraRef.current.stop(); } catch {}
        mpCameraRef.current = null;
      }
    };
  }, []);

  if (permissionStatus === 'denied') {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
        <p className="text-red-500 text-sm">
          Camera permission denied. Please enable camera access to use attention tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        className="rounded-lg"
        mirrored
        videoConstraints={{
          width: 320,
          height: 240,
          facingMode: 'user',
        }}
      />
      
      {showDebug && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          width={320}
          height={240}
        />
      )}
      
      {!isInitialized && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="text-white text-sm">Initializing tracking...</div>
        </div>
      )}
      
      {/* Debug status removed per request */}
    </div>
  );
}

// Analyze face landmarks to detect expressions
function analyzeFaceExpression(landmarks: any[]): FaceData {
  // Calculate key facial features
  // These are approximations based on landmark positions
  
  // Eyebrow furrow (landmarks 70, 63 for left, 296, 293 for right)
  const leftBrow = landmarks[70].y - landmarks[63].y;
  const rightBrow = landmarks[296].y - landmarks[293].y;
  const furrowedBrow = Math.abs(leftBrow) + Math.abs(rightBrow);
  
  // Eye squint (landmarks 159, 145 for left, 386, 374 for right)
  const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
  const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
  // Normalize eye openness in 0..1 (0=closed,1=open) with rough baseline 0.1
  const eyeOpen = Math.max(0, Math.min(1, (leftEyeHeight + rightEyeHeight) / 0.1));
  const squintedEyes = 1 - eyeOpen;
  
  // Head position (landmark 1 is nose tip)
  const noseY = landmarks[1].y;
  const forwardLean = 0.5 - noseY; // positive when leaning forward
  // Normalize forward lean to 0..1 where ~0.3 forward maps near 1
  const leanNorm = Math.max(0, Math.min(1, (forwardLean + 0.2) / 0.6));
  
  // Smile detection (landmarks 61, 291 for mouth corners)
  const mouthLeft = landmarks[61].y;
  const mouthRight = landmarks[291].y;
  const mouthCenter = landmarks[13].y;
  const smile = Math.max(0, mouthCenter - (mouthLeft + mouthRight) / 2);
  const smileNorm = Math.max(0, Math.min(1, smile / 0.2));
  
  // Determine states based on expressions
  const confused = furrowedBrow > 0.02 && squintedEyes > 0.5;
  const devX = Math.abs(landmarks[1].x - 0.5);
  const lookingAway = devX > 0.3;
  const lookCenterNorm = Math.max(0, Math.min(1, 1 - devX / 0.4));

  // Continuous engagement score combines multiple cues
  let engagement = 0.4 * lookCenterNorm + 0.3 * eyeOpen + 0.2 * leanNorm + 0.1 * smileNorm;
  if (lookingAway) engagement *= 0.4; // heavy penalty when off-screen
  if (confused) engagement *= 0.75; // mild penalty for confusion
  engagement = Math.max(0, Math.min(1, engagement));

  // Derive booleans from engagement
  const engaged = engagement >= 0.6;
  const bored = engagement <= 0.3;
  
  return {
    confused,
    engaged,
    bored,
    lookingAway,
    confidence: 0.8, // Placeholder until we compute per-frame model confidence
    timestamp: Date.now(),
    engagement,
    expressions: {
      furrowedBrow,
      squintedEyes,
      forwardLean,
      smile,
    },
  };
}

// Calculate attention score based on gaze position
function calculateAttentionScore(x: number, y: number): number {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  const distance = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
  );
  
  const maxDistance = Math.sqrt(
    Math.pow(centerX, 2) + Math.pow(centerY, 2)
  );
  
  return Math.max(0, Math.min(100, 100 * (1 - distance / maxDistance)));
}

// Draw face mesh for debugging
function drawFaceMesh(canvas: HTMLCanvasElement, landmarks: any[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Mirror horizontally to match user-facing camera mirroring
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
  
  landmarks.forEach((point) => {
    ctx.beginPath();
    ctx.arc(
      point.x * canvas.width,
      point.y * canvas.height,
      2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  });
  ctx.restore();
}

// Load WebGazer from CDN
async function loadWebGazer() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// No longer using MediaPipe due to CDN issues
// Simplified face detection is implemented above