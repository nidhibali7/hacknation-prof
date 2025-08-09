# 🎯 ProfAI: The Video That Watches You Back
## MIT Lectures Meet TikTok - 17 Hour Team Build Plan

---

## 📋 Executive Summary

### **The Product**
60-second AI lessons that adapt to your confusion in real-time, followed by hands-on practice and proof videos. Turn any PDF, YouTube video, or topic into personalized micro-lessons.

### **The Hook**
"Traditional videos talk AT you. ProfAI talks WITH you - and knows when you're lost."

### **Core Innovation**
1. **Watch** (60s) - Adaptive micro-lesson that responds to your face
2. **Build** (5 min) - Immediate coding challenge 
3. **Prove** (30s) - Record yourself explaining what you learned

---

## 🎨 Core Features

### **1. Multi-Modal Input System**

#### **Face & Eye Tracking**
```javascript
// WebGazer.js for gaze tracking
const gazeData = {
  lookingAway: gazeOutsideViewport > 500ms,
  attentionScore: movingAverage(last30s),
  distractionEvents: countLookAways(last2min)
}

// MediaPipe for expressions
const expressions = {
  confused: furrowedBrow + squintedEyes,
  engaged: forwardLean + steady gaze,
  bored: slouchPosture + wanderingEyes
}
```

#### **Voice Commands (Always Listening)**
```javascript
const VOICE_COMMANDS = {
  "go deeper": DEEPEN_CONTENT,
  "simplify": SIMPLIFY_EXPLANATION,
  "show code": DISPLAY_CODE,
  "give example": SHOW_ANALOGY,
  "skip": NEXT_SECTION,
  "pause": PAUSE_LESSON,
  "repeat": REPLAY_SEGMENT
}
```

### **2. Content Generation from Any Source**

#### **PDF/YouTube Ingestion**
```typescript
// Convert ANY content to micro-lessons
async function ingestContent(source: PDF | YouTubeURL | Topic) {
  const text = await extractText(source);
  const chunks = intelligentChunking(text);
  
  return await generateLessons({
    chunks,
    format: "60-second-segments",
    variants: ["normal", "simplified", "advanced"],
    challenges: true
  });
}
```

### **3. Adaptive State Machine**

```mermaid
INTRO → EXPLAIN
  ├─[CONFUSION]→ SIMPLIFY_EXPLAIN
  ├─[DEEPEN]→ ADVANCED_EXPLAIN
  ├─[DISTRACTION]→ BREAK_SUGGESTION
  └─[COMPLETE]→ BUILD_CHALLENGE → PROVE → FEEDBACK
```

---

## 👥 3-Person Team Division

### **Person A: Sensing & Interaction**
**Owner of all input systems**

**Deliverables:**
- WebGazer.js eye tracking setup
- MediaPipe face detection
- Voice command recognition
- Attention scoring algorithm
- Break detection system

**Key Files:**
```
/components/CameraAttention.tsx
/components/VoiceCommands.tsx
/lib/gazeTracking.ts
/lib/expressionDetection.ts
```

**Hour-by-Hour:**
- **Hours 0-3**: WebGazer setup, basic gaze detection
- **Hours 3-6**: Voice commands via Web Speech API
- **Hours 6-9**: Attention scoring, break triggers
- **Hours 9-12**: Integration with state machine

### **Person B: AI & Content Engine**
**Owner of lesson generation and adaptation**

**Deliverables:**
- PDF/YouTube text extraction
- GPT-4 lesson generation
- Adaptive content variants
- State machine logic
- Evaluation system

**Key Files:**
```
/api/ingest/pdf/route.ts
/api/ingest/youtube/route.ts
/api/lesson/generate/route.ts
/api/lesson/next/route.ts
/api/evaluate/route.ts
/lib/stateMachine.ts
```

**Hour-by-Hour:**
- **Hours 0-3**: PDF/YouTube ingestion APIs
- **Hours 3-6**: Lesson generation with GPT-4
- **Hours 6-9**: State machine with variants
- **Hours 9-12**: Proof video evaluation

### **Person C: UI & User Experience**
**Owner of interface and flow**

**Deliverables:**
- Topic selection interface
- Video player with animations
- Build challenge sandbox
- Proof video recorder
- Results dashboard
- Deployment

**Key Files:**
```
/app/page.tsx (topic select)
/app/lesson/[id]/page.tsx
/app/prove/page.tsx
/components/LessonPlayer.tsx
/components/ProofRecorder.tsx
/components/CodeSandbox.tsx
```

**Hour-by-Hour:**
- **Hours 0-3**: Basic UI structure, routing
- **Hours 3-6**: Lesson player with TTS
- **Hours 6-9**: Proof video recording
- **Hours 9-12**: Polish, animations, deploy

---

## ⏰ Integrated Timeline (17 Hours)

### **Phase 1: Foundation (Hours 0-3)**
**All Together:**
- Set up repo, dependencies, Vercel project
- Define shared interfaces and events
- Choose test content (1 PDF, 1 YouTube video)

**Then Split:**
- A: WebGazer running, basic gaze detection
- B: PDF/YouTube extraction working
- C: UI skeleton with routing

**Integration Test:** Can detect looking away + extract text + navigate pages

### **Phase 2: Core Loop (Hours 3-7)**
**Morning Sync (Hour 3):**
- Share progress, adjust plan

**Parallel Work:**
- A: Voice commands → state machine events
- B: Generate first lessons with variants
- C: Lesson player with animated text

**Integration Test (Hour 7):** Complete lesson plays with voice control

### **Phase 3: Adaptation (Hours 7-10)**
**Parallel Work:**
- A: Confusion detection, attention scoring
- B: State machine responds to events
- C: Build challenge interface

**Integration Test:** Saying "simplify" changes content

### **Phase 4: Prove Loop (Hours 10-13)**
**Parallel Work:**
- A: Break suggestions, polish detection
- B: Evaluation API with GPT-4
- C: Proof video recording & upload

**Integration Test:** Full Watch→Build→Prove cycle

### **Phase 5: Polish (Hours 13-15)**
**All Together:**
- Fix critical bugs
- Add achievements/gamification
- Polish animations
- Prepare demo content

### **Phase 6: Demo Prep (Hours 15-17)**
- Practice demo 5 times
- Record backup video
- Deploy to production
- Prepare for Q&A

---

## 💻 Technical Implementation

### **Core Stack**
```javascript
// Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Framer Motion
- Zustand (state)

// AI & Voice
- GPT-4 (content generation)
- ElevenLabs (TTS)
- Web Speech API (voice commands)
- Whisper API (proof video transcription)

// Detection
- WebGazer.js (eye tracking)
- MediaPipe Face Mesh (expressions)

// Infrastructure
- Vercel (hosting + edge functions)
- Vercel Blob (video storage)
```

### **Key Components**

#### **1. Adaptive Lesson Player**
```typescript
// components/LessonPlayer.tsx
export function LessonPlayer({ lesson, onComplete }) {
  const { faceData } = useFaceTracking();
  const { voiceCommand } = useVoiceCommands();
  const [variant, setVariant] = useState<'normal' | 'simple' | 'advanced'>('normal');
  const [speed, setSpeed] = useState(1.0);
  
  // Real-time adaptation
  useEffect(() => {
    if (faceData.confused && faceData.confidence > 0.7) {
      setVariant('simple');
      setSpeed(0.8);
      speak("I see that face - let me explain differently...");
    }
    
    if (voiceCommand === 'DEEPEN') {
      setVariant('advanced');
      speak("Let's dive deeper...");
    }
    
    if (faceData.lookingAway) {
      pause();
      speak("Hey! This part's important!");
    }
  }, [faceData, voiceCommand]);
  
  return (
    <div className="aspect-[9/16] bg-gradient-to-br from-purple-900 to-blue-900">
      <AnimatedText 
        text={lesson.variants[variant].text}
        speed={speed}
      />
      {lesson.code && <CodePreview code={lesson.code} />}
    </div>
  );
}
```

#### **2. Proof Video Recorder**
```typescript
// components/ProofRecorder.tsx
export function ProofRecorder({ challenge, onSubmit }) {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const mediaRecorder = useRef<MediaRecorder>();
  
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    mediaRecorder.current = new MediaRecorder(stream);
    const chunks = [];
    
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
    };
    
    mediaRecorder.current.start();
    setRecording(true);
    
    // Auto-stop after 30 seconds
    setTimeout(() => stopRecording(), 30000);
  };
  
  const submitProof = async () => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    formData.append('challenge', challenge.id);
    
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      body: formData
    });
    
    const feedback = await response.json();
    onSubmit(feedback);
  };
  
  return (
    <div className="flex flex-col items-center p-8">
      <h2 className="text-2xl font-bold mb-4">
        Explain what you built (30 seconds)
      </h2>
      
      <div className="bg-black rounded-lg w-full max-w-md aspect-video mb-6">
        {videoBlob ? (
          <video src={URL.createObjectURL(videoBlob)} controls />
        ) : (
          <Webcam />
        )}
      </div>
      
      {!recording && !videoBlob && (
        <button onClick={startRecording} className="btn-primary">
          Start Recording
        </button>
      )}
      
      {recording && (
        <div className="text-red-500">
          Recording... (auto-stops at 30s)
        </div>
      )}
      
      {videoBlob && (
        <div className="flex gap-4">
          <button onClick={() => setVideoBlob(null)}>
            Re-record
          </button>
          <button onClick={submitProof} className="btn-primary">
            Submit Proof
          </button>
        </div>
      )}
    </div>
  );
}
```

#### **3. Content Ingestion**
```typescript
// api/ingest/youtube/route.ts
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(request: Request) {
  const { url } = await request.json();
  
  // Extract transcript
  const transcript = await YoutubeTranscript.fetchTranscript(url);
  const text = transcript.map(t => t.text).join(' ');
  
  // Generate micro-lessons
  const lessons = await generateLessons(text);
  
  return Response.json({
    source: url,
    title: await getVideoTitle(url),
    lessons: lessons,
    duration: lessons.length * 60 // seconds
  });
}

async function generateLessons(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: `Convert this content into 3-5 sixty-second micro-lessons.
        Each lesson should:
        1. Focus on ONE concept
        2. Include a hook, explanation, and example
        3. Have simplified and advanced variants
        4. Include a 5-minute coding challenge
        5. Define success criteria for the proof video`
    }, {
      role: 'user',
      content: text
    }]
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 🎮 State Machine Logic

```typescript
// lib/stateMachine.ts
export const lessonMachine = {
  initial: 'intro',
  states: {
    intro: {
      on: {
        START: 'explain'
      }
    },
    explain: {
      on: {
        CONFUSION: 'simplify',
        DEEPEN: 'advanced',
        DISTRACTION: 'break',
        COMPLETE: 'challenge'
      }
    },
    simplify: {
      on: {
        UNDERSTOOD: 'explain',
        STILL_CONFUSED: 'analogy',
        SKIP: 'challenge'
      }
    },
    advanced: {
      on: {
        CONFUSION: 'explain',
        COMPLETE: 'challenge'
      }
    },
    break: {
      after: {
        60000: 'explain' // Resume after 60s
      }
    },
    challenge: {
      on: {
        COMPLETE: 'prove'
      }
    },
    prove: {
      on: {
        SUBMITTED: 'feedback'
      }
    },
    feedback: {
      type: 'final'
    }
  }
};
```

---

## 🎯 Demo Script (3.5 Minutes)

### **Act 1: The Hook (20s)**
"Everyone's tried learning from YouTube. You watch, you nod, you forget. Why? Because the video doesn't know you exist."

### **Act 2: The Magic (30s)**
"ProfAI is different. Paste any YouTube link or PDF..."
*Paste MIT lecture link*
"...and it creates micro-lessons that watch YOU back."

### **Act 3: Live Demo (2 min)**

**Watch Phase (45s):**
- Lesson starts playing
- Look confused → "I see that face, let me simplify..."
- Say "show code" → Code appears instantly
- Look away → "Hey! Eyes here, this is important!"

**Build Phase (45s):**
- "Now let's build it. You have 5 minutes."
- Show coding challenge in browser
- Quick montage of typing
- Submit solution

**Prove Phase (30s):**
- "Explain what you built"
- Record 30-second explanation
- AI feedback: "Great understanding of concepts! You missed error handling."

### **Act 4: The Results (30s)**
- "In 6 minutes, you didn't just watch - you learned, built, and proved it."
- Show stats: "87% attention, 2 adaptations, 1 working project"
- "From ANY content source. MIT lectures, documentation, YouTube tutorials."

### **Act 5: The Vision (20s)**
"Imagine every piece of educational content working this way. Not passive videos, but active conversations. That's ProfAI."

---

## 🚨 Critical Success Factors

### **Must Have by Hour 10:**
1. ✅ Eye tracking that detects looking away
2. ✅ Voice commands working ("simplify", "skip")
3. ✅ One complete lesson from YouTube/PDF
4. ✅ Content changes based on confusion
5. ✅ Basic proof video recording

### **Nice to Have:**
- Embedded TikTok clips
- Multiple teacher personalities
- Gamification/achievements
- Social sharing

### **Demo Backup Plan:**
If live detection fails:
- Use keyboard shortcuts (1-5) to trigger states
- Pre-record "confused" and "engaged" faces
- Have backup videos of each phase

---

## 💡 Key Differentiators

1. **Input Flexibility**: Works with ANY content (PDF/YouTube/Topic)
2. **Multi-Modal Control**: Face + Voice + Gaze (not just one)
3. **Active Learning**: Build + Prove (not just watch)
4. **Real-Time Adaptation**: Content changes AS you learn
5. **60-Second Format**: TikTok attention span, MIT depth

---

## 🔧 Quick Start

```bash
# Setup (Hour 0)
npx create-next-app@latest profai --typescript --tailwind --app
cd profai
npm install @mediapipe/face_mesh webgazer zustand
npm install youtube-transcript pdf-parse

# Environment Variables
echo "OPENAI_API_KEY=..." >> .env.local
echo "ELEVENLABS_API_KEY=..." >> .env.local

# Development
npm run dev

# Three terminals for team:
# Terminal 1 (Person A): npm run dev:sensing
# Terminal 2 (Person B): npm run dev:api  
# Terminal 3 (Person C): npm run dev:ui
```

---

## 📊 Success Metrics

**Technical:**
- Eye tracking latency < 100ms
- Voice command recognition > 80%
- Lesson generation < 30s
- Proof evaluation < 10s

**Educational:**
- Attention score > 75%
- Challenge completion > 60%
- Proof video quality > 7/10
- Concept retention (self-reported) > 80%

---

## 🏆 Why This Wins

1. **Solves Real Problem**: Passive learning → Active engagement
2. **Technical Innovation**: First to combine face + voice + build + prove
3. **Practical Value**: Works with existing content (PDFs/YouTube)
4. **Memorable Demo**: "The video that watches you back"
5. **Scalable Vision**: Could transform all online education

---

## Final Advice

**The Three P's:**
1. **Prioritize** the core loop (Watch→Build→Prove)
2. **Polish** the adaptation moments (when it responds to confusion)
3. **Practice** the demo until it's flawless

**Remember:** The magic isn't in perfect detection—it's in the RESPONSE. When the video says "I see you're confused," that's the winning moment.

*Ship the adaptation. Win the hackathon. Change education.*