import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY
})

export async function POST(req: NextRequest) {

    try {

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return Response.json(
                { error: 'No file uploaded' },
                { status: 400 }
            )
        }


        /* Size limit */
        if (file.size > 5 * 1024 * 1024) {
            return Response.json(
                { error: 'Image too large. Max 5MB' },
                { status: 400 }
            )
        }


        const bytes = await file.arrayBuffer()

        const base64 =
            Buffer
                .from(bytes)
                .toString('base64')

        const mimeType = file.type


        const { text } = await generateText({

            model: openrouter(
                'google/gemini-2.0-flash-001'
            ),

            maxRetries: 1,

            abortSignal:
                AbortSignal.timeout(60000),

            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text:
                                'Extract all text from this image. Return only raw text.'
                        },
                        {
                            type: 'image',
                            image:
                                `data:${mimeType};base64,${base64}`
                        }
                    ]
                }
            ]

        })


        if (!text?.trim()) {
            return Response.json(
                {
                    error: 'Could not extract text'
                },
                {
                    status: 400
                }
            )
        }


        return Response.json({
            text
        })

    }

    catch (err: any) {

        console.error(err)

        return Response.json(
            {
                error:
                    err.message || 'Extraction failed'
            },
            {
                status: 500
            }
        )

    }

}