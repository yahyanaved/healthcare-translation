/* eslint-disable @typescript-eslint/no-require-imports */
// Use the LibreTranslate API for free translations
// No API key required for local testing or small-scale usage

import { NextResponse } from 'next/server';

const translate = require('translate-google')

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(body)
    const { text, targetLanguage, sourceLanguage } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Text and targetLanguage are required' }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ error: 'Text is too long. Must be 1000 characters or less' }, { status: 400 });
    }

    const translation = await translate(text, { from: sourceLanguage, to: targetLanguage });

    return NextResponse.json({ translatedText: translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'An error occurred during translation' }, { status: 500 });
  }
}
