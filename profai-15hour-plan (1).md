# 🎯 ProfAI Sprint Board - 17 Hour Build
## "The Video That Watches You Back"

---

## 🏆 The One Thing We're Building
**A single "Vector Embeddings 101" lesson that:**
- Pauses when you look away
- Simplifies when you say "simplify" (or press S)
- Deepens when you say "go deeper" (or press D)
- Makes you build something
- Records you explaining it back

**That's it. Nothing else.**

---

## 📌 Core Decisions (LOCKED)

### **What We're Building:**
✅ ONE lesson (pre-generated) with 3 variants (normal/simple/advanced)  
✅ YouTube OR PDF ingestion (pick ONE, demo it, claim both)  
✅ Voice commands OR keyboard shortcuts (both trigger same events)  
✅ Gaze detection for attention (binary: looking or not)  
✅ 30-second proof videos with instant GPT feedback  

### **What We're NOT Building:**
❌ Multiple lessons or dynamic generation  
❌ Complex facial expression analysis  
❌ User accounts or progress saving  
❌ Real-time lesson generation (pre-generate everything)  
❌ Video storage (keep in browser memory)  

---

## 👥 Team Tickets (Just Check Them Off)

### **🟦 Person A: Sensing (Hours 0-10)**

#### **Priority 1: Gaze Detection (Hours 0-4)**
- [ ] **A1.1** Install WebGazer.js, get red dot showing gaze position
- [ ] **A1.2** Detect "looking at screen" vs "looking away" (binary)
- [ ] **A1.3** Count look-aways: 3 in 60s = DISTRACTION event
- [ ] **A1.4** Test in different lighting, add calibration screen

#### **Priority 2: Voice Commands (Hours 4-7)**
- [ ] **A2.1** Web Speech API setup with continuous listening
- [ ] **A2.2** Detect 5 commands: "simplify", "deeper", "pause", "resume", "skip"
- [ ] **A2.3** Visual indicator when voice is heard
- [ ] **A2.4** Keyboard fallback: S/D/Space/Enter/Arrow keys

#### **Priority 3: Attention Logic (Hours 7-10)**
- [ ] **A3.1** Attention score = % time looking at screen (30s window)
- [ ] **A3.2** "Confusion" = saying "simplify" or "repeat" 2x in 30s
- [ ] **A3.3** Break trigger: attention < 50% for 20s → BREAK event
- [ ] **A3.4** Connect all events to Zustand store

**Deliverable:** `useAttention()` hook that returns `{isLooking, attentionScore, shouldBreak}`

---

### **🟩 Person B: Content Engine (Hours 0-10)**

#### **Priority 1: Golden Lesson (Hours 0-3)**
- [ ] **B1.1** Write one lesson: "Vector Embeddings 101" (60s read time)
- [ ] **B1.2** Create 3 variants: normal, simplified (analogies), advanced (math)
- [ ] **B1.3** Write one coding challenge: "Find similar sentences"
- [ ] **B1.4** Store as JSON, no API calls during demo

#### **Priority 2: State Machine (Hours 3-6)**
- [ ] **B2.1** Simple state: EXPLAIN → CHALLENGE → PROVE → FEEDBACK
- [ ] **B2.2** SIMPLIFY event → load simple variant
- [ ] **B2.3** DEEPEN event → load advanced variant
- [ ] **B2.4** DISTRACTION event → show break modal

#### **Priority 3: Ingestion (Hours 6-9) - PICK ONE**
- [ ] **B3.1** YouTube: youtube-transcript to extract text
- [ ] **B3.2** OR PDF: pdf-parse to extract text
- [ ] **B3.3** Clean text, chunk into 60s segments
- [ ] **B3.4** One-time generate lesson (can be fake/cached for demo)

#### **Priority 4: Evaluation (Hours 9-10)**
- [ ] **B4.1** Transcribe proof video with Whisper (or Web Speech)
- [ ] **B4.2** GPT rubric: "Did they mention: vectors, similarity, embedding?"
- [ ] **B4.3** Return 3 points: score/10, what they got right, one improvement
- [ ] **B4.4** Cache responses for demo reliability

**Deliverable:** Pre-generated lesson + evaluation that always works

---

### **🟨 Person C: UI & Flow (Hours 0-10)**

#### **Priority 1: Core Player (Hours 0-4)**
- [ ] **C1.1** Animated text that types out word by word
- [ ] **C1.2** Play/pause based on `isLooking` from Person A
- [ ] **C1.3** Speed control: 0.7x (confused) to 1.3x (bored)
- [ ] **C1.4** ElevenLabs TTS or browser speech

#### **Priority 2: Visual Polish (Hours 4-6)**
- [ ] **C2.1** Red overlay when looking away: "👀 Hey! Look here!"
- [ ] **C2.2** Smooth transitions between variants (fade in/out)
- [ ] **C2.3** Progress bar showing lesson position
- [ ] **C2.4** Voice command indicator: "Heard: simplify"

#### **Priority 3: Build & Prove (Hours 6-9)**
- [ ] **C3.1** Embedded CodeSandbox or Monaco editor
- [ ] **C3.2** Pre-filled starter code for challenge
- [ ] **C3.3** MediaRecorder for 30s proof video
- [ ] **C3.4** Feedback card with score + 3 points

#### **Priority 4: Landing (Hour 9-10)**
- [ ] **C4.1** Simple landing: "Paste YouTube URL" → "Start Learning"
- [ ] **C4.2** Demo mode button (loads pre-cached lesson)
- [ ] **C4.3** Mobile responsive
- [ ] **C4.4** Deploy to Vercel

**Deliverable:** Smooth UI that never breaks during demo

---

## ⏰ Integration Schedule

### **Hour 0-1: Setup Together**
```bash
# One repo, three branches
git init profai
npm create next-app . --typescript --tailwind --app
npm install webgazer zustand youtube-transcript

# Each person branches
git checkout -b sensing    # Person A
git checkout -b content    # Person B  
git checkout -b ui         # Person C
```

### **Hour 10: First Integration**
- Merge all branches
- Wire A's events → B's state machine → C's UI
- Test core loop: look away → pause → look back → resume

### **Hour 11-12: Polish Integration**
- Voice command → variant switching
- Complete Watch → Build → Prove flow
- Fix critical bugs only

### **Hour 13-14: Demo Content**
- Pre-generate perfect "Vector Embeddings" lesson
- Record backup videos of each phase
- Cache all API responses

### **Hour 15-16: Demo Practice**
- Run through 5 times
- Assign roles: who drives, who talks, who handles Q&A
- Prepare for failures (keyboard shortcuts ready)

### **Hour 16-17: Final Deploy**
- Deploy to production Vercel
- Test on demo machine
- Rest before presentation

---

## 🎬 The 3-Minute Demo Script

### **0:00-0:20 - Hook**
"Everyone watches coding tutorials. Nobody finishes them. Why? Because the video doesn't know you exist."

### **0:20-0:40 - Setup**
"Paste any YouTube link..." *paste MIT lecture*  
"ProfAI creates micro-lessons that watch YOU back."

### **0:40-1:40 - The Magic (WATCH)**
- Start lesson on vectors
- Look away → "HEY! Eyes here! 👀"
- Say "simplify" → Content changes to analogy
- Say "go deeper" → Shows mathematical formula
- Complete first segment

### **1:40-2:20 - The Build (BUILD)**
- "Now build it. Find similar sentences using embeddings."
- Show pre-filled code
- Make small edit
- Submit solution

### **2:20-2:50 - The Proof (PROVE)**
- "Explain what you built"
- Record 30 seconds
- Get instant feedback: "8/10 - Great understanding of similarity! Consider mentioning cosine distance."

### **2:50-3:00 - The Close**
"In 3 minutes, you didn't just watch—you learned, built, and proved it. That's ProfAI."

---

## 🚨 Fallback for Everything

### **If WebGazer fails:**
- Use simple webcam on/off detection
- Or use Tab focus/blur events

### **If voice fails:**
- Keyboard shortcuts prominently displayed
- S = Simplify, D = Deeper, Space = Pause

### **If recording fails:**
- Type explanation instead of video
- Still run through same evaluation

### **If nothing works:**
- Show pre-recorded video of it working
- "Here's what you would have seen..."

---

## ✅ Definition of Done (Hour 10)

**The Minimum Viable Demo:**
- [ ] Lesson plays and pauses when you look away
- [ ] Saying "simplify" changes the content
- [ ] One coding challenge appears
- [ ] Can record 30s video
- [ ] Get feedback with score

**If you have these five things, you can win.**

---

## 🎯 Success Metrics

### **Technical (Must Have):**
- Look-away detection < 500ms
- Voice command recognition > 60% accuracy
- Lesson variant switch < 1 second
- Proof video records successfully

### **Demo (Must Have):**
- Every judge sees the "look away → pause" moment
- At least one "simplify" → content change
- Smooth transitions, no crashes
- Under 3 minutes total

---

## 💡 The One-Page Pitch

### **Problem**
Traditional videos are passive. 90% of people drop out.

### **Solution**  
Videos that watch you back and adapt in real-time.

### **How It Works**
1. **Watches** your attention via webcam
2. **Listens** to voice commands
3. **Adapts** content to confusion
4. **Forces** active practice
5. **Validates** understanding

### **Demo Impact**
"The first time a video has ever known I was confused."

### **Market**
Every tutorial, course, and educational video could work this way.

---

## 🔥 Final Advice

### **The Only 3 Things That Matter:**

1. **The Pause** - When they look away and it pauses, that's your hook
2. **The Adapt** - When they say "simplify" and content changes, that's your magic  
3. **The Prove** - When they explain it back, that's your validation

**Everything else is optional.**

### **Time Allocation:**
- 40% on core detection (look away + voice)
- 30% on smooth UI reactions
- 20% on demo practice
- 10% on everything else

### **Remember:**
You're not building a platform. You're building a 3-minute demo that makes judges say "whoa." Focus everything on those 3 minutes.

---

## 🚀 Quick Commands

```bash
# Start development (3 terminals)
npm run dev           # Main app
npm run gaze          # Person A: Gaze testing
npm run voice         # Person A: Voice testing

# Pre-generate content (Hour 8)
npm run generate-lesson

# Deploy (Hour 16)
vercel --prod

# Demo mode (Hour 15)
npm run demo   # Loads cached everything
```

---

**Ship the pause. Ship the adaptation. Ship the proof. Win the hackathon.**