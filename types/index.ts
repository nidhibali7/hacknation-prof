// Core types for ProfAI - Shared across all team members

// ============= LESSON TYPES =============
export interface Lesson {
  id: string;
  title: string;
  source: ContentSource;
  duration: number; // seconds
  segments: LessonSegment[];
  challenge?: CodingChallenge;
  metadata: LessonMetadata;
}

export interface LessonSegment {
  id: string;
  order: number;
  concept: string; // The specific concept being taught
  variants: {
    normal: SegmentContent;
    simplified: SegmentContent;
    advanced: SegmentContent;
  };
  triggers: AdaptationTrigger[];
}

export interface SegmentContent {
  text: string;
  code?: string;
  visualAid?: string;
  speakingRate: number; // 0.5 to 2.0
  emphasis?: string[]; // words to emphasize
}

export interface LessonMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  prerequisites: string[];
  estimatedTime: number; // minutes
}

// ============= CHALLENGE TYPES =============
export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solution?: string;
  tests: TestCase[];
  hints: string[];
  timeLimit: number; // minutes
}

export interface TestCase {
  input: any;
  expectedOutput: any;
  description: string;
  hidden?: boolean;
}

export interface ProofVideo {
  id: string;
  challengeId: string;
  videoUrl: string;
  transcription?: string;
  duration: number;
  recordedAt: Date;
  evaluation?: Evaluation;
}

export interface Evaluation {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  conceptsUnderstood: string[];
  conceptsMissed: string[];
}

// ============= SENSING TYPES (Person A) =============
export interface FaceData {
  confused: boolean;
  engaged: boolean;
  bored: boolean;
  lookingAway: boolean;
  confidence: number; // 0-1
  timestamp: number;
  expressions: {
    furrowedBrow: number;
    squintedEyes: number;
    forwardLean: number;
    smile: number;
  };
}

export interface GazeData {
  x: number;
  y: number;
  outsideViewport: boolean;
  duration: number; // ms looking at current position
  attentionScore: number; // 0-100
  distractionEvents: number;
}

export type VoiceCommand = 
  | 'DEEPEN'
  | 'SIMPLIFY'
  | 'SHOW_CODE'
  | 'EXAMPLE'
  | 'SKIP'
  | 'PAUSE'
  | 'REPEAT'
  | 'HELP'
  | 'CONFUSED';

export interface SensingState {
  face: FaceData | null;
  gaze: GazeData | null;
  lastVoiceCommand: VoiceCommand | null;
  attentionLevel: 'high' | 'medium' | 'low';
  shouldTakeBreak: boolean;
}

// ============= STATE MACHINE TYPES =============
export type LessonState = 
  | 'intro'
  | 'explain'
  | 'simplify'
  | 'advanced'
  | 'analogy'
  | 'break'
  | 'challenge'
  | 'prove'
  | 'feedback'
  | 'complete';

export interface LessonEvent {
  type: 
    | 'START'
    | 'CONFUSION'
    | 'DEEPEN'
    | 'DISTRACTION'
    | 'UNDERSTOOD'
    | 'STILL_CONFUSED'
    | 'SKIP'
    | 'COMPLETE'
    | 'SUBMITTED'
    | 'TIMEOUT';
  timestamp: number;
  data?: any;
}

export interface AdaptationTrigger {
  condition: 'confusion' | 'distraction' | 'voice_command' | 'time_elapsed';
  threshold?: number;
  action: 'simplify' | 'deepen' | 'break' | 'repeat' | 'skip';
}

// ============= CONTENT TYPES =============
export type ContentSource = 
  | { type: 'youtube'; url: string; title?: string }
  | { type: 'pdf'; url: string; filename?: string }
  | { type: 'topic'; query: string }
  | { type: 'text'; content: string };

export interface IngestRequest {
  source: ContentSource;
  options?: {
    maxLessons?: number;
    targetDuration?: number; // seconds per lesson
    difficulty?: 'auto' | 'beginner' | 'intermediate' | 'advanced';
  };
}

// ============= USER SESSION TYPES =============
export interface UserSession {
  id: string;
  userId?: string;
  startedAt: Date;
  lessons: LessonProgress[];
  totalAttentionScore: number;
  completedChallenges: number;
  achievements: Achievement[];
}

export interface LessonProgress {
  lessonId: string;
  state: LessonState;
  startedAt: Date;
  completedAt?: Date;
  adaptations: number;
  attentionScore: number;
  challengeCompleted: boolean;
  proofSubmitted: boolean;
  evaluationScore?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

// ============= API TYPES =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface GenerateLessonRequest {
  content: string;
  source: ContentSource;
  options?: {
    segments?: number;
    includeChallenges?: boolean;
    difficulty?: string;
  };
}

export interface EvaluateProofRequest {
  videoBlob: Blob;
  challengeId: string;
  lessonId: string;
  transcription?: string;
}

// ============= STORE TYPES =============
export interface AppState {
  // Current lesson
  currentLesson: Lesson | null;
  currentSegment: number;
  currentVariant: 'normal' | 'simplified' | 'advanced';
  lessonState: LessonState;
  
  // Sensing
  sensing: SensingState;
  
  // User progress
  session: UserSession | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showBreakSuggestion: boolean;
  
  // Actions
  setCurrentLesson: (lesson: Lesson) => void;
  updateSensing: (data: Partial<SensingState>) => void;
  transitionState: (event: LessonEvent) => void;
  nextSegment: () => void;
  previousSegment: () => void;
  setVariant: (variant: 'normal' | 'simplified' | 'advanced') => void;
  resetSession: () => void;
}