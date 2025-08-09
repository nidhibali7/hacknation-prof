# 🎯 ProfAI - The Video That Watches You Back

**MIT Hackathon Project** - 60-second AI lessons that adapt to your confusion in real-time

## 🚀 Quick Start (< 5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# 3. Run development server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

## 👥 Team Development (3-Person Parallel Work)

### Person A: Sensing & Interaction
```bash
npm run dev:sensing  # Port 3001
```
**Your Files:**
- `/components/CameraAttention.tsx` - Face/eye tracking
- `/components/VoiceCommands.tsx` - Voice recognition
- `/lib/gazeTracking.ts` - Gaze detection logic
- `/lib/expressionDetection.ts` - Expression analysis

### Person B: AI & Content Engine
```bash
npm run dev:api  # Port 3002
```
**Your Files:**
- `/app/api/ingest/*` - Content ingestion
- `/app/api/lesson/*` - Lesson generation
- `/app/api/evaluate/*` - Proof evaluation
- `/lib/stateMachine.ts` - Adaptation logic

### Person C: UI & User Experience
```bash
npm run dev:ui  # Port 3003
```
**Your Files:**
- `/app/*` - Pages and routing
- `/components/LessonPlayer.tsx` - Main player
- `/components/ProofRecorder.tsx` - Video recording
- `/components/CodeSandbox.tsx` - Challenge interface

## 🏗️ Architecture

```
Watch (60s) → Build (5min) → Prove (30s) → Feedback
     ↓             ↓            ↓            ↓
[Adaptive]   [Challenge]   [Record]    [AI Score]
```

## 🔑 Key Features

1. **Multi-Modal Input**: Face + Voice + Gaze tracking
2. **Real-Time Adaptation**: Content changes based on confusion
3. **Any Content Source**: YouTube, PDF, or topic
4. **Proof Videos**: 30-second explanations with AI feedback
5. **60-Second Format**: TikTok attention span, MIT depth

## 📝 Environment Variables

```env
# Required
OPENAI_API_KEY=your_key_here

# Optional (for production)
ELEVENLABS_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
```

## 🧪 Testing the Demo

### Test Content Sources:
- **YouTube**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **Topic**: "Introduction to React Hooks"
- **PDF**: Any technical PDF under 10MB

### Voice Commands to Test:
- "simplify" - Easier explanation
- "go deeper" - Advanced content
- "show code" - Display example
- "skip" - Next section
- "pause" - Pause lesson

### Simulate Confusion:
- Furrow your brow
- Squint your eyes
- Look away from screen

## 🎮 Demo Script (3 minutes)

1. **Hook (20s)**: "YouTube doesn't know you exist. ProfAI does."
2. **Input (10s)**: Paste YouTube link
3. **Watch Phase (45s)**: Show confusion → content adapts
4. **Build Phase (45s)**: Quick code challenge
5. **Prove Phase (30s)**: Record explanation
6. **Results (30s)**: Show AI feedback and score

## 🚨 Critical Checkpoints

### Hour 3: Foundation ✅
- [ ] Camera permission working
- [ ] Basic UI routing
- [ ] API endpoints created

### Hour 7: Core Loop ✅
- [ ] Lessons playing with TTS
- [ ] Voice commands working
- [ ] State machine running

### Hour 10: Adaptation ✅
- [ ] Confusion triggers simplification
- [ ] Content variants switching
- [ ] Challenge interface ready

### Hour 13: Prove Loop ✅
- [ ] Video recording works
- [ ] Evaluation API returns scores
- [ ] Full cycle completes

### Hour 15: Polish ✅
- [ ] Animations smooth
- [ ] No console errors
- [ ] Demo content ready

### Hour 17: Demo Ready ✅
- [ ] Deployed to Vercel
- [ ] Backup video recorded
- [ ] Team practiced 5 times

## 🐛 Common Issues & Fixes

**Camera not working?**
```bash
# Check HTTPS (required for camera)
# Use ngrok for local testing with HTTPS
ngrok http 3000
```

**Voice commands not detecting?**
```javascript
// Check Chrome flags
chrome://flags/#unsafely-treat-insecure-origin-as-secure
// Add http://localhost:3000
```

**State machine stuck?**
```javascript
// Reset in console
localStorage.clear();
location.reload();
```

## 🏆 Why We Win

1. **Technical Innovation**: First to combine face + voice + build + prove
2. **Real Problem**: Passive videos → Active learning
3. **Working Demo**: All features functional
4. **Memorable Hook**: "The video that watches you back"
5. **Scalable Vision**: Could transform all online education

## 📞 Emergency Contacts

- **Vercel Deploy Issues**: Check build logs
- **API Rate Limits**: Use mock data fallbacks
- **Camera Permissions**: Have backup demo video
- **Last Resort**: Run locally with ngrok

## 🎯 Final Checklist

- [ ] All team members can demo independently
- [ ] Backup laptop with code ready
- [ ] Demo works offline (mock data)
- [ ] Slides have QR code to live demo
- [ ] Energy drinks in backpack

---

**Remember**: The magic is in the RESPONSE to confusion, not perfect detection.

**Ship it. Win it. Change education.**