import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // "Bella" - American female voice

export async function POST(request: NextRequest) {
  try {
    const { text, speed = 1.0 } = await request.json();

    if (!ELEVENLABS_API_KEY) {
      console.log('[TTS] No ElevenLabs API key, returning error for fallback');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 501 }
      );
    }

    console.log('[TTS] Generating speech with ElevenLabs...');

    // ElevenLabs API request
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[TTS] ElevenLabs error:', error);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();

    // Return the audio file
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available voices (optional endpoint for testing)
export async function GET() {
  if (!ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 501 });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    const data = await response.json();
    
    // Return American voices
    const americanVoices = data.voices.filter((voice: any) => 
      voice.labels?.accent === 'american' || 
      voice.labels?.accent === 'american-neutral'
    );

    return NextResponse.json({
      voices: americanVoices.map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url,
        labels: v.labels,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
  }
}