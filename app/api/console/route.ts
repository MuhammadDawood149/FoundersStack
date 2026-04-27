import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json()

        // Get logged in user via server client (reads cookies)
        const serverSupabase = await createSupabaseServerClient()
        const { data: { user } } = await serverSupabase.auth.getUser()
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const currentUser = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Founder'

        // Fetch ONLY this user's actions (RLS handles it automatically)
        const { data: actions } = await serverSupabase
            .from('actions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        const actionsContext = actions?.length
            ? actions.map(a =>
                `- ${a.title} (${a.priority} priority, ${a.type}, ${a.status}${a.owner ? ', owner: ' + a.owner : ''}${a.due_date ? ', due: ' + a.due_date : ''})`
            ).join('\n')
            : 'No actions yet.'

        // Build conversation history text
        const historyText = (history || [])
            .map((m: { role: string; content: string }) =>
                `${m.role === 'user' ? currentUser : 'Assistant'}: ${m.content}`)
            .join('\n')

        const { text } = await generateText({
            model: openrouter('openrouter/auto'),
            prompt: `You are an AI assistant for ${currentUser}, an early-stage startup founder using Founders Stack.
You have access to ${currentUser}'s current action items:

${actionsContext}

Answer clearly and concisely. If they ask about urgent items, priorities, owners, or summaries — use the data above.
Keep responses short (2-4 sentences max). Address the founder as ${currentUser} when relevant.

${historyText ? `Conversation so far:\n${historyText}\n` : ''}
${currentUser}: ${message}
Assistant:`,
        })

        return Response.json({ reply: text.trim() })

    } catch (err: any) {
        console.error('Console API error:', err)
        return Response.json({ error: err.message }, { status: 500 })
    }
}