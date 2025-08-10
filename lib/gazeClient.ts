/**
 * WebSocket client for communicating with Python GazeTracking service
 */

export interface GazeData {
  timestamp: number;
  pupil_left: [number, number] | null;
  pupil_right: [number, number] | null;
  horizontal_ratio: number | null;
  vertical_ratio: number | null;
  is_left: boolean;
  is_right: boolean;
  is_center: boolean;
  is_blinking: boolean;
  attention_score: number;
  frame_processed: boolean;
  error?: string;
}

export interface GazeClientOptions {
  onGazeData?: (data: GazeData) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  serverUrl?: string;
}

export class GazeClient {
  private ws: WebSocket | null = null;
  private options: GazeClientOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private frameQueue: string[] = [];
  private processingFrame = false;

  constructor(options: GazeClientOptions = {}) {
    this.options = {
      serverUrl: 'ws://localhost:8001/ws/gaze',
      ...options
    };
  }

  /**
   * Connect to the GazeTracking WebSocket service
   */
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      console.log('[GazeClient] Connecting to GazeTracking service...');
      this.ws = new WebSocket(this.options.serverUrl!);

      this.ws.onopen = () => {
        console.log('[GazeClient] Connected to GazeTracking service');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.options.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'gaze_data') {
            this.processingFrame = false;
            this.options.onGazeData?.(message.data);
            
            // Process next frame in queue if available
            this.processNextFrame();
          } else if (message.type === 'pong') {
            // Handle ping/pong for connection health
          }
        } catch (error) {
          console.error('[GazeClient] Error parsing message:', error);
          this.options.onError?.(`Failed to parse message: ${error}`);
        }
      };

      this.ws.onclose = () => {
        console.log('[GazeClient] Disconnected from GazeTracking service');
        this.isConnecting = false;
        this.ws = null;
        this.options.onDisconnect?.();
        
        // Attempt to reconnect
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[GazeClient] WebSocket error:', error);
        this.isConnecting = false;
        this.options.onError?.('WebSocket connection error');
      };

    } catch (error) {
      this.isConnecting = false;
      console.error('[GazeClient] Failed to connect:', error);
      this.options.onError?.(`Connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from the GazeTracking service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.frameQueue = [];
    this.processingFrame = false;
  }

  /**
   * Send a video frame for gaze tracking analysis
   */
  sendFrame(frameDataUrl: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[GazeClient] WebSocket not connected, cannot send frame');
      return;
    }

    // Add frame to queue to avoid overwhelming the service
    this.frameQueue.push(frameDataUrl);
    
    // Process frame if not already processing
    if (!this.processingFrame) {
      this.processNextFrame();
    }
  }

  /**
   * Process the next frame in the queue
   */
  private processNextFrame(): void {
    if (this.processingFrame || this.frameQueue.length === 0) {
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.frameQueue = []; // Clear queue if not connected
      return;
    }

    this.processingFrame = true;
    const frameData = this.frameQueue.shift()!;

    const message = {
      type: 'frame',
      data: frameData
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[GazeClient] Error sending frame:', error);
      this.processingFrame = false;
      this.options.onError?.(`Failed to send frame: ${error}`);
    }
  }

  /**
   * Attempt to reconnect to the service
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[GazeClient] Max reconnection attempts reached');
      this.options.onError?.('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`[GazeClient] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send a ping to check connection health
   */
  ping(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
}

/**
 * Utility function to capture frame from video element as base64
 */
export function captureVideoFrame(video: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('[GazeClient] Error capturing video frame:', error);
    return null;
  }
}
