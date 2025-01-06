'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, MicOff, Loader2, VolumeIcon } from 'lucide-react'

type Language = 'en' | 'es' | 'mx'

export default function AudioRecorderTranscriberTranslator() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [transcribedText, setTranscribedText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sourceLanguage, setSourceLanguage] = useState<Language>('en')
  const [targetLanguage, setTargetLanguage] = useState<Language>('es')
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        sendAudioToAPI(blob)
        chunksRef.current = []
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Error accessing microphone. Please check your permissions and try again.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const sendAudioToAPI = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true)
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recorded_audio.webm')
    formData.append('language', sourceLanguage)

    try {
      const response = await fetch('/api/synthesize/audio', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTranscribedText(data.text)
      setError(null)
      await translateText(data.text)
    } catch (err) {
      console.error('Error sending audio to API:', err)
      setError('Error transcribing audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [sourceLanguage])

  const translateText = useCallback(async (text: string) => {
    if (sourceLanguage === targetLanguage) {
      setTranslatedText(text)
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTranslatedText(data.translatedText)
    } catch (err) {
      console.error('Error translating text:', err)
      setError('Error translating text. Please try again.')
    } finally {
      setIsTranslating(false)
    }
  }, [sourceLanguage, targetLanguage])

  const generateAudio = useCallback(async () => {
    setIsGeneratingAudio(true)
    try {
      const response = await fetch('/api/synthesize/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: translatedText,
          language: targetLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      setAudioSrc(audioUrl)
    } catch (err) {
      console.error('Error generating audio:', err)
      setError('Error generating audio. Please try again.')
    } finally {
      setIsGeneratingAudio(false)
    }
  }, [translatedText, targetLanguage])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc)
      }
    }
  }, [audioSrc])

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Audio Recorder, Transcriber, and Translator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-between items-center gap-2">
            <Select
              value={sourceLanguage}
              onValueChange={(value: Language) => setSourceLanguage(value)}
              disabled={isRecording || isProcessing}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="mx">Mexican Spanish</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isTranslating || isGeneratingAudio}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Recording
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          </div>
          <Textarea
            placeholder="Transcribed text will appear here..."
            value={transcribedText}
            readOnly
            rows={4}
            aria-label="Transcribed text"
          />
          <div className="flex justify-between items-center gap-2">
            <Select
              value={targetLanguage}
              onValueChange={(value: Language) => setTargetLanguage(value)}
              disabled={isRecording || isProcessing || isTranslating || isGeneratingAudio}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Translation Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="mx">Mexican Spanish</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={generateAudio}
              disabled={!translatedText || isGeneratingAudio}
              aria-label="Generate audio from translated text"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                <>
                  <VolumeIcon className="mr-2 h-4 w-4" />
                  Generate Audio
                </>
              )}
            </Button>
          </div>
          <Textarea
            placeholder="Translated text will appear here..."
            value={translatedText}
            readOnly
            rows={4}
            aria-label="Translated text"
          />
          {isTranslating && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Translating...</span>
            </div>
          )}
          {audioSrc && (
            <audio ref={audioRef} controls src={audioSrc} className="w-full">
              Your browser does not support the audio element.
            </audio>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

