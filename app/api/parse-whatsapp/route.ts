import { NextRequest } from 'next/server'

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

        const text = await file.text()

        const lines = text.split(/\r?\n/)

        const messages: string[] = []
        let currentMessage = ""

        for (let rawLine of lines) {

            // remove hidden unicode chars WhatsApp sometimes inserts
            const line = rawLine
                .replace(/\u200e/g, '')
                .replace(/\u202c/g, '')
                .trim()

            if (!line) continue


            // FORMAT 1
            // [27/01/2025, 14:32:05] Paul: Hello
            let match = line.match(
                /^\[.*?\]\s.*?:\s(.+)$/
            )


            // FORMAT 2
            // 1/27/25, 2:32 PM - Paul: Hello
            if (!match) {
                match = line.match(
                    /^.*?\s-\s.*?:\s(.+)$/
                )
            }


            // New message detected
            if (match) {

                // push previous multiline message
                if (currentMessage) {
                    messages.push(currentMessage.trim())
                }

                currentMessage = match[1]

            } else {

                // Continuation of previous multiline message
                if (currentMessage) {
                    currentMessage += " " + line
                }
            }
        }


        // push last message
        if (currentMessage) {
            messages.push(currentMessage.trim())
        }


        const cleaned = messages.join('\n')


        if (!cleaned.trim()) {
            return Response.json(
                {
                    error:
                        'Could not parse WhatsApp file. Make sure it is a valid exported chat.'
                },
                { status: 400 }
            )
        }

        return Response.json({
            text: cleaned
        })

    } catch (err: any) {

        return Response.json(
            {
                error: err.message || 'Server error'
            },
            { status: 500 }
        )

    }
}