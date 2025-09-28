const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

export type GenerateRequest = {
  message: string
  context?: string
  tone?: string
  language?: string
  options?: Record<string, any>
  history?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
}

export type GenerateResponse = {
  id: string
  model: string
  output: string
  usage?: any
}

export async function generateFeedback(payload: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${BASE_URL}/api/feedback/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Backend error ${res.status}: ${text}`)
  }
  return res.json()
}

export function streamFeedback(params: Omit<GenerateRequest, 'options'> & { signal?: AbortSignal }, onChunk: (text: string) => void): Promise<void> {
  const url = new URL(`${BASE_URL}/api/feedback/stream`)
  if (params.message) url.searchParams.set('message', params.message)
  if (params.context) url.searchParams.set('context', params.context)
  if (params.tone) url.searchParams.set('tone', params.tone)
  if (params.language) url.searchParams.set('language', params.language)

  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(url.toString(), { signal: params.signal })
      if (!res.ok || !res.body) throw new Error(`Stream failed ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        for (let i = 0; i < parts.length - 1; i++) {
          const block = parts[i]
          const dataLine = block.split('\n').find(l => l.startsWith('data: '))
          if (!dataLine) continue
          const jsonStr = dataLine.slice(6)
          try {
            const evt = JSON.parse(jsonStr)
            if (evt?.text) onChunk(evt.text)
          } catch {}
        }
        buffer = parts[parts.length - 1]
      }
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}
