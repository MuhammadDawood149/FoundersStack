'use client'

import { useState, useRef } from 'react'

type Action = {
  id: string
  title: string
  owner?: string
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  status: string
  type: 'task' | 'follow-up' | 'reminder'
  urgency: 'urgent' | 'normal'
}

type InputMode = 'text' | 'whatsapp'

export default function Home() {
  const [mode, setMode] = useState<InputMode>('text')
  const [input, setInput] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Extracting actions...')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setLoadingMessage('Parsing WhatsApp chat...')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/parse-whatsapp', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.error) {
        alert('Parse error: ' + data.error)
        setFileName(null)
      } else {
        setInput(data.text)
      }
    } catch (err) {
      alert('Failed to read file: ' + err)
      setFileName(null)
    }

    setLoading(false)
  }

  const handleExtract = async () => {
    if (!input.trim()) return
    setLoading(true)
    setLoadingMessage('Extracting actions...')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (data.error) alert('Error: ' + data.error)
      setActions(data.actions || [])
    } catch (err) {
      alert('Something went wrong: ' + err)
    }
    setLoading(false)
  }

  const urgent = actions.filter(a => a.urgency === 'urgent')
  const normal = actions.filter(a => a.urgency === 'normal')

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Founders Stack</h1>
        <p className="text-gray-500 mb-6">Dump your thoughts. Get structured actions.</p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode('text'); setFileName(null); setInput('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === 'text'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            ✏️ Text
          </button>
          <button
            onClick={() => { setMode('whatsapp'); setInput('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === 'whatsapp'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            💬 WhatsApp Chat
          </button>
        </div>

        {/* Text Mode */}
        {mode === 'text' && (
          <textarea
            className="w-full h-40 p-4 border border-gray-200 rounded-xl text-gray-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. need to follow up with Ahsan, finish pitch deck by Friday, check API costs with Sam..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}

        {/* WhatsApp Mode */}
        {mode === 'whatsapp' && (
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-green-300 rounded-xl bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 transition"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileName ? (
              <>
                <p className="text-2xl mb-2">💬</p>
                <p className="font-medium text-gray-800">{fileName}</p>
                <p className="text-sm text-green-600 mt-1">
                  {input ? `${input.split('\n').length} messages parsed` : 'Parsing...'}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-2">📂</p>
                <p className="font-medium text-gray-700">Upload WhatsApp export</p>
                <p className="text-sm text-gray-400 mt-1">Export chat → Without Media → upload .txt file</p>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleExtract}
          disabled={loading || !input.trim()}
          className="mt-4 w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {loading ? loadingMessage : 'Extract Actions'}
        </button>

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
  const typeColors: Record<string, string> = {
    'follow-up': 'bg-blue-100 text-blue-700',
    'reminder': 'bg-purple-100 text-purple-700',
    'task': 'bg-gray-100 text-gray-700',
  }
  const typeIcons: Record<string, string> = {
    'follow-up': '↩️',
    'reminder': '⏰',
    'task': '✅',
  }

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${action.urgency === 'urgent' ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900">{action.title}</p>
        <div className="flex gap-1 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColors[action.type]}`}>
            {typeIcons[action.type]} {action.type}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${priorityColors[action.priority]}`}>
            {action.priority}
          </span>
        </div>
      </div>
      {action.owner && <p className="text-sm text-gray-500 mt-1">Owner: {action.owner}</p>}
      {action.due_date && <p className="text-sm text-gray-500">Due: {action.due_date}</p>}
    </div>
  )
}