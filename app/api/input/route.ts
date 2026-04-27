import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
})

const ActionSchema = z.object({
    actions: z.array(
        z.object({
            title: z.string(),
            owner: z.string().nullish().transform(v => v ?? undefined),
            priority: z.enum(['high', 'medium', 'low']),
            due_date: z.string().nullish().transform(v => v ?? undefined),
            due_date_parsed: z.string().nullish().transform(v => v ?? undefined),
            type: z.enum(['task', 'follow-up', 'reminder']),
            urgency: z.enum(['urgent', 'normal']),
            confidence: z.number().min(0).max(1).nullish().transform(v => v ?? undefined),
        })
    ),
})

export async function POST(req: Request) {
    try {
        const { input } = await req.json()

        // Get logged in user via server client (reads cookies)
        const serverSupabase = await createSupabaseServerClient()
        const { data: { user } } = await serverSupabase.auth.getUser()
        console.log('USER:', user?.email, '| SESSION CHECK')
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const currentUser = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Founder'

        // Get team members from DB (excluding current user)
        const { data: teamMembers } = await serverSupabase
            .from('team_members')
            .select('name')
        const teamNames = teamMembers?.map((m: { name: string }) => m.name).filter(n => n !== currentUser) ?? []

        const { text } = await generateText({
            model: openrouter('openrouter/auto'),
            prompt: `You are an AI assistant for early-stage startup founders.
Extract ALL action items from the following input. Do not skip any.
Respond ONLY with valid JSON — no explanation, no markdown, no code blocks.

Current user (the person who wrote this input): "${currentUser}"
Known team members: [${teamNames.join(', ')}]

Rules for extraction:
- Extract EVERY implied task, not just obvious ones.
- Do NOT invent or hallucinate names. Use exact labels from input.
- Uncertain language like "not sure if...", "can you check..." → type "follow-up".

Owner assignment rules (read carefully):
- "I", "me", "we", "us" → owner is "${currentUser}".
- If a known team member IS DOING the task (e.g. "${teamNames[0] ?? 'co-founder'} needs to finish the backend") → assign to that team member by name.
- "my co-founder", "co-founder" → assign to the team member who is NOT "${currentUser}" from [${teamNames.join(', ')}].
- If the task is ABOUT a person but "${currentUser}" is doing it (e.g. "follow up with Ahmed", "send pricing to Ahmed") → owner is "${currentUser}".
- Investor, customer, lead, or vendor names in context like "reach out to X", "send X the deck", "follow up with X" → owner is "${currentUser}".
- If truly unknown or ambiguous → owner is "${currentUser}".

For each action identify:
- title: specific and actionable (include the person's name if relevant, e.g. "Follow up with Ahmed")
- owner: who is responsible for doing this task (see rules above)
- priority: "high" if urgent or deadline soon, "low" if uncertain or optional, "medium" otherwise
- due_date: raw string as mentioned in the input
- due_date_parsed: ISO 8601 UTC if resolvable, omit if not
- type: "follow-up" if checking on someone or something | "reminder" if time-based nudge | "task" for everything else
- urgency: "urgent" if needs immediate attention | "normal" otherwise
- confidence: 0.0–1.0 how confident you are this is a real action item

Return this exact JSON format:
{
  "actions": [
    {
      "title": "...",
      "owner": "...",
      "priority": "high|medium|low",
      "due_date": "...",
      "due_date_parsed": "...",
      "type": "task|follow-up|reminder",
      "urgency": "urgent|normal",
      "confidence": 0.9
    }
  ]
}

Input: "${input}"`,
        })

        // Strip markdown code blocks if model wraps response
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = ActionSchema.parse(JSON.parse(clean))

        const { data, error } = await serverSupabase
            .from('actions')
            .insert(
                parsed.actions.map((action) => ({
                    ...action,
                    raw_input: input,
                    status: 'todo',
                    user_id: user.id,
                }))
            )
            .select()

        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ actions: data })

    } catch (err: any) {
        console.error('API Error:', err)
        return Response.json({ error: err.message }, { status: 500 })
    }
}