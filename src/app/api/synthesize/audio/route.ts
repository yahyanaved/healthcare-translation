import { validateAudioFile } from '@/utils/audio';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const language = formData.get('language');
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    try {
      await validateAudioFile(audioFile);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const validLanguages = ['en', 'es', 'fr'];
    if (language && !validLanguages.includes(language.toString())) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }
    // Convert audio file to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload the audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY || '',
        'Content-Type': 'application/octet-stream',
      },
      body: buffer
    });

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;

    // Start transcription
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: language || 'en' // can be changed for other languages
      })
    });

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    // Poll for transcription completion
    let transcript;
    while (true) {
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': process.env.ASSEMBLYAI_API_KEY || ''
        }
      });
      
      transcript = await pollingResponse.json();
      
      if (transcript.status === 'completed') {
        break;
      } else if (transcript.status === 'error') {
        throw new Error('Transcription failed');
      }
      
      // Wait for 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      text: transcript.text
    });

  } catch (error) {
    console.error('Error processing speech to text:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}