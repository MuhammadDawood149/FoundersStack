'use client'

import { useState, useRef } from 'react'

type Action = {
  id: string
  title: string
  owner?: string
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  type?: string
  urgency?: string
  status: string
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
}

const typeIcons: Record<string, string> = {
  task: '✓',
  'follow-up': '↩',
  reminder: '⏰',
}

export default function Home() {
  const [input, setInput] = useState('')
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const imageRef = useRef<HTMLInputElement>(null)
  const whatsappRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)
  const voiceRef = useRef<HTMLInputElement>(null)

  const extractActions = async (text: string) => {
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text }),
    })
    const data = await res.json()
    if (data.error) alert('Error: ' + data.error)
    setActions(data.actions || [])
  }

  const handleExtract = async () => {
    if (!input.trim()) return
    setLoading(true)
    setLoadingMsg('Extracting actions...')
    try {
      await extractActions(input)
    } catch (err) {
      alert('Something went wrong: ' + err)
    }
    setLoading(false)
    setLoadingMsg('')
  }

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setLoadingMsg('Reading image...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-image', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); return }
      setInput(data.text)
      setLoadingMsg('Extracting actions...')
      await extractActions(data.text)
    } catch (err) {
      alert('Something went wrong: ' + err)
    }
    setLoading(false)
    setLoadingMsg('')
  }

  const handleWhatsApp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setLoadingMsg('Parsing WhatsApp chat...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-whatsapp', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); return }
      setInput(data.text)
      setLoadingMsg('Extracting actions...')
      await extractActions(data.text)
    } catch (err) {
      alert('Something went wrong: ' + err)
    }
    setLoading(false)
    setLoadingMsg('')
  }

  const handleDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setLoadingMsg(file.name.endsWith('.pdf') ? 'Reading PDF...' : 'Reading document...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); return }
      setInput(data.text)
      setLoadingMsg('Extracting actions...')
      await extractActions(data.text)
    } catch (err) {
      alert('Something went wrong: ' + err)
    }
    setLoading(false)
    setLoadingMsg('')
  }

  const handleVoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setLoadingMsg('Transcribing voice note...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-voice', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) { alert('Error: ' + data.error); return }
      setInput(data.text)
      setLoadingMsg('Extracting actions...')
      await extractActions(data.text)
    } catch (err) {
      alert('Something went wrong: ' + err)
    }
    setLoading(false)
    setLoadingMsg('')
  }

  const urgent = actions.filter(a => a.urgency === 'urgent')
  const normal = actions.filter(a => a.urgency === 'normal')

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Founders Stack</h1>
        <p className="text-gray-500 mb-6">Dump your thoughts. Get structured actions.</p>

        <textarea
          className="w-full h-40 p-4 border border-gray-200 rounded-xl text-gray-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="e.g. need to follow up with Ahsan, finish pitch deck by Friday..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="mt-3 flex gap-3 flex-wrap">
          <button
            onClick={handleExtract}
            disabled={loading}
            className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? loadingMsg : 'Extract Actions'}
          </button>

          <button
            onClick={() => imageRef.current?.click()}
            disabled={loading}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium text-gray-700"
          >
            📷 Image
          </button>

          <button
            onClick={() => whatsappRef.current?.click()}
            disabled={loading}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium text-gray-700"
          >
            💬 WhatsApp
          </button>

          <button
            onClick={() => docRef.current?.click()}
            disabled={loading}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium text-gray-700"
          >
            📄 PDF/Doc
          </button>

          <button
            onClick={() => voiceRef.current?.click()}
            disabled={loading}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 transition text-sm font-medium text-gray-700"
          >
            🎙️ Voice
          </button>
        </div>

        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <input ref={whatsappRef} type="file" accept=".txt" className="hidden" onChange={handleWhatsApp} />
        <input ref={docRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleDocument} />
        <input ref={voiceRef} type="file" accept="audio/*" className="hidden" onChange={handleVoice} />

        {actions.length > 0 && (
          <div className="mt-8 space-y-6">

            {urgent.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">
                  🔥 Urgent ({urgent.length})
                </h2>
                <div className="space-y-3">
                  {urgent.map((action) => (
                    <ActionCard key={action.id} action={action} />
                  ))}
                </div>
              </div>
            )}

            {normal.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Actions ({normal.length})
                </h2>
                <div className="space-y-3">
                  {normal.map((action) => (
                    <ActionCard key={action.id} action={action} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  )
}

function ActionCard({ action }: { action: Action }) {
  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  }

  const typeIcons: Record<string, string> = {
    task: '✓',
    'follow-up': '↩',
    reminder: '⏰',
  }

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${action.urgency === 'urgent' ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-gray-400 mt-0.5">{typeIcons[action.type || 'task']}</span>
          <p className="font-medium text-gray-900">{action.title}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {action.urgency === 'urgent' && (
            <span className="text-xs px-2 py-1 rounded-full border font-medium bg-orange-100 text-orange-700 border-orange-200">
              urgent
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${priorityColors[action.priority]}`}>
            {action.priority}
          </span>
        </div>
      </div>
      {action.owner && <p className="text-sm text-gray-500 mt-2 ml-6">Owner: {action.owner}</p>}
      {action.due_date && <p className="text-sm text-gray-500 ml-6">Due: {action.due_date}</p>}
    </div>
  )
}