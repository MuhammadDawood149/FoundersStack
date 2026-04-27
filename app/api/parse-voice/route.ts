import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return Response.json({ error: 'No audio file uploaded' }, { status: 400 })
        }

        if (file.size > 10 * 1024 * 1024) {
            return Response.json({ error: 'Audio too large. Max 10MB.' }, { status: 400 })
        }

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3',
            response_format: 'text',
        })

        const text = transcription as unknown as string

        if (!text?.trim()) {
            return Response.json({ error: 'Could not transcribe audio.' }, { status: 400 })
        }

        return Response.json({ text })

    } catch (err: any) {
        console.error('parse-voice error:', err)
        return Response.json({ error: err.message || 'Transcription failed' }, { status: 500 })
    }
}