import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
    const { input } = await req.json()

    const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: z.object({
            actions: z.array(
                z.object({
                    title: z.string(),
                    owner: z.string().optional(),
                    priority: z.enum(['high', 'medium', 'low']),
                    due_date: z.string().optional(),
                })
            ),
        }),
        prompt: `You are an AI assistant for startup founders.
Extract all action items from the following founder input.
For each action, identify: title, owner (who should do it), priority (high/medium/low), and due date if mentioned.
Input: "${input}"`,
    })

    const { data, error } = await supabase
        .from('actions')
        .insert(
            object.actions.map((action) => ({
                ...action,
                raw_input: input,
                status: 'todo',
            }))
        )
        .select()

    if (error) return Response.json({ error }, { status: 500 })

    return Response.json({ actions: data })
}