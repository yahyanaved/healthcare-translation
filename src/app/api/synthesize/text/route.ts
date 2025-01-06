// app/api/synthesize/text/route.ts
import { NextRequest, NextResponse } from 'next/server'

const VOICE_RSS_API_KEY = process.env.VOICE_RSS_API_KEY || ''

const SUPPORTED_LANGUAGES = {
  'en-US': 'en-us',
  'es-ES': 'es-es',
  'es-MX': 'es-mx'
}

export async function POST(req: NextRequest) {
  try {
    const { text, language: languageParam = 'en' } = await req.json()
    let language
    switch (languageParam) {
      case 'es':
        language = 'es-ES'
        break
      case 'en':
        language = 'en-US'
        break
      default:
        language = languageParam
    }
    console.log(language)
    // Input validation
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES]) {
      return NextResponse.json(
        { error: 'Unsupported language' },
        { status: 400 }
      )
    }

    // Construct VoiceRSS API URL with parameters
    const voiceRSSParams = new URLSearchParams({
      key: VOICE_RSS_API_KEY,
      src: text,
      hl: SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES],
      c: 'MP3', // Audio format
      f: '44khz_16bit_stereo', // Audio quality
      r: '0', // Reading speed (0 = normal)
      v: language.includes('es') ? 'Lucia' : 'Linda' // Voice name
    })

    const apiUrl = `https://api.voicerss.org/?${voiceRSSParams.toString()}`

    // Fetch audio from VoiceRSS
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`VoiceRSS API error: ${response.statusText}`)
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()

    // Return the audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"'
      }
    })

  } catch (error) {
    console.error('Error in text-to-speech conversion:', error)
    return NextResponse.json(
      { error: 'Failed to convert text to speech' },
      { status: 500 }
    )
  }
}