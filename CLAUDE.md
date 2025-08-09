# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProfAI is an adaptive educational platform that creates 60-second AI lessons from any content source (PDF, YouTube, or topic). The system uses real-time face tracking, voice commands, and eye tracking to adapt content delivery based on user engagement and comprehension.

## Project Setup and Development

### Initial Setup
```bash
# Create Next.js application with TypeScript and Tailwind
npx create-next-app@latest profai --typescript --tailwind --app
cd profai

# Install core dependencies
npm install @mediapipe/face_mesh webgazer zustand
npm install youtube-transcript pdf-parse
npm install framer-motion

# Set up environment variables
echo "OPENAI_API_KEY=your_key_here" >> .env.local
echo "ELEVENLABS_API_KEY=your_key_here" >> .env.local
```

### Development Commands
```bash
# Start development server
npm run dev

# For team development (3 parallel terminals):
npm run dev:sensing  # Person A: Sensing & Interaction
npm run dev:api      # Person B: AI & Content Engine  
npm run dev:ui       # Person C: UI & User Experience
```

### Build and Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Architecture

### Core Features
1. **Multi-Modal Input System**: Face/eye tracking + voice commands
2. **Content Generation**: Converts PDFs/YouTube videos to micro-lessons
3. **Adaptive State Machine**: Real-time content adaptation based on user state

### Key Modules

#### Sensing & Interaction (Person A)
- **WebGazer.js**: Eye tracking and gaze detection
- **MediaPipe**: Face expression detection
- **Web Speech API**: Voice command recognition
- **Files**:
  - `/components/CameraAttention.tsx`
  - `/components/VoiceCommands.tsx`
  - `/lib/gazeTracking.ts`
  - `/lib/expressionDetection.ts`

#### AI & Content Engine (Person B)
- **Content Ingestion**: PDF/YouTube text extraction
- **GPT-4 Integration**: Lesson generation with variants
- **State Machine**: Adaptive lesson flow control
- **Files**:
  - `/api/ingest/pdf/route.ts`
  - `/api/ingest/youtube/route.ts`
  - `/api/lesson/generate/route.ts`
  - `/lib/stateMachine.ts`

#### UI & User Experience (Person C)
- **Lesson Player**: Animated text with real-time adaptation
- **Proof Recorder**: 30-second video recording
- **Code Sandbox**: In-browser coding challenges
- **Files**:
  - `/app/page.tsx`
  - `/app/lesson/[id]/page.tsx`
  - `/components/LessonPlayer.tsx`
  - `/components/ProofRecorder.tsx`

### State Machine Flow
```
INTRO → EXPLAIN → [CONFUSION/DEEPEN/DISTRACTION] → CHALLENGE → PROVE → FEEDBACK
```

### Voice Commands
- "go deeper" - Advanced explanation
- "simplify" - Simplified explanation
- "show code" - Display code example
- "give example" - Show analogy
- "skip" - Next section
- "pause" - Pause lesson
- "repeat" - Replay segment

## Development Timeline

### Phase 1 (Hours 0-3): Foundation
- Repository setup and dependencies
- WebGazer eye tracking
- PDF/YouTube extraction
- UI skeleton

### Phase 2 (Hours 3-7): Core Loop
- Voice commands integration
- Lesson generation with variants
- Animated lesson player

### Phase 3 (Hours 7-10): Adaptation
- Confusion detection
- State machine implementation
- Build challenge interface

### Phase 4 (Hours 10-13): Prove Loop
- Break suggestions
- GPT-4 evaluation API
- Proof video recording

### Phase 5 (Hours 13-17): Polish & Demo
- Bug fixes and animations
- Demo preparation
- Production deployment

## Critical Success Factors

### Must Have Features
- Eye tracking that detects looking away
- Voice commands ("simplify", "skip")
- Content generation from YouTube/PDF
- Content adaptation based on confusion
- Proof video recording

### Performance Targets
- Eye tracking latency < 100ms
- Voice command recognition > 80%
- Lesson generation < 30s
- Proof evaluation < 10s