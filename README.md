# ProfAI

Adaptive AI professor that creates personalized lessons from any content and adapts in real-time based on student engagement.

## Features

- Generate audio and text lessons from PDFs, YouTube videos, or topics
- Real-time adaptation using face tracking and voice commands
- Multiple AI providers (Anthropic Claude, OpenAI GPT-4)
- Text-to-speech professor recitation with ElevenLabs
- Interactive challenges and proof recording

## Setup

```bash
# Install dependencies
npm install
```

# Set environment variables
```
cp .env.example .env.local
# Add your API keys to .env.local:
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY  
# - ELEVENLABS_API_KEY
```

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **State**: Zustand
- **AI**: Anthropic Claude (primary), OpenAI GPT-4 (fallback)
- **Voice**: ElevenLabs TTS
- **Tracking**: MediaPipe (face), WebGazer (eyes)

## Optional: Python Gaze Service

For advanced eye tracking:

```bash
cd python-gaze-service
./start_service.sh
```

## Development

```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Lint code
npm run type-check # Type checking
```
