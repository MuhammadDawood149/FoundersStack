import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { supabase } from '@/lib/supabase'

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const { question } = await req.json()

        const { data: actions, error } = await supabase
            .from('actions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) return Response.json({ error: error.message }, { status: 500 })

        const { text } = await generateText({
            model: openrouter('google/gemini-2.0-flash-001'),
            prompt: `You are an AI assistant for a startup founder.
You have access to their current action items listed below.
Answer their question clearly and concisely based on this data.
If they ask to summarize, list, or filter — do it cleanly.
If they ask something unrelated to the actions, politely redirect.

Current Actions:
${JSON.stringify(actions, null, 2)}

Founder's question: "${question}"`,
        })

        return Response.json({ answer: text })

    } catch (err: any) {
        console.error('Console API error:', err)
        return Response.json({ error: err.message }, { status: 500 })
    }
}