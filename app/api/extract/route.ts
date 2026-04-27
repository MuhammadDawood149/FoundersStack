import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

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

        // Get logged in user
        const { data: { user } } = await supabase.auth.getUser()
        const currentUser = user?.user_metadata?.full_name ?? 'Founder'

        // Get team members from DB
        const { data: teamMembers } = await supabase
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
Resolved co-founder: "${teamNames.find(name => name !== currentUser) || ''}"

Rules for extraction:
- Extract EVERY implied task, not just obvious ones.
- Do NOT invent or hallucinate names. Use exact labels from input.
- Uncertain language like "not sure if...", "can you check...", "might need to...", "maybe..." → type "follow-up".

Owner assignment rules (read carefully):
- "I", "me", "we", "us" → owner is "${currentUser}".
- If a known team member is explicitly doing the task (e.g. "${teamNames[0] ?? 'Sam'} needs to finish the backend") → assign to that team member.
- "my co-founder", "co-founder" → ALWAYS assign to "${teamNames.find(name => name !== currentUser) || ''}".
- Never assign "${currentUser}" to any task explicitly owned by "my co-founder".
- If the task is ABOUT a person but "${currentUser}" is doing it (e.g. "follow up with Ahmed", "send pricing to Ahmed") → owner is "${currentUser}".
- Investor, customer, lead, vendor, or external names in context like "reach out to X", "send X the deck", "follow up with X" → owner is "${currentUser}".
- If truly unknown or ambiguous → owner is "${currentUser}".

For each action identify:
- title: specific and actionable (include the person's name if relevant, e.g. "Follow up with Ahmed")
- owner: who is responsible for doing this task
- priority: "high" if urgent, due today, due tomorrow, or deadline soon; "low" if uncertain, optional, speculative, or weak intent; "medium" otherwise
- due_date: raw string as mentioned in the input
- due_date_parsed: ISO 8601 UTC if resolvable, omit if not
- type: "follow-up" if checking on someone/something or uncertain next step | "reminder" if time-based nudge | "task" for everything else
- urgency: "urgent" if immediate attention needed, blocked, critical issue, or due now/today | "normal" otherwise
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

        const { data, error } = await supabase
            .from('actions')
            .insert(
                parsed.actions.map((action) => ({
                    ...action,
                    raw_input: input,
                    status: 'todo',
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