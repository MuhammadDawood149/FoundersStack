// @ts-ignore
global.DOMMatrix = global.DOMMatrix || class DOMMatrix { }

import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return Response.json({ error: 'No file uploaded' }, { status: 400 })
        }

        if (file.size > 10 * 1024 * 1024) {
            return Response.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const fileName = file.name.toLowerCase()

        let text = ''

        if (fileName.endsWith('.docx')) {
            const mammoth = require('mammoth')
            const result = await mammoth.extractRawText({ buffer })
            text = result.value
        } else if (fileName.endsWith('.pdf')) {
            const pdfParse = require('pdf-parse')
            const result = await pdfParse(buffer)
            text = result.text
        } else {
            return Response.json({ error: 'Unsupported file type. Upload a PDF or DOCX.' }, { status: 400 })
        }

        if (!text?.trim()) {
            return Response.json({ error: 'Could not extract text from document.' }, { status: 400 })
        }

        return Response.json({ text })

    } catch (err: any) {
        console.error('parse-document error:', err)
        return Response.json({ error: err.message || 'Extraction failed' }, { status: 500 })
    }
}