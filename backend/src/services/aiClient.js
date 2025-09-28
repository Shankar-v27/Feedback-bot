function getBaseUrl () {
  return process.env.AI_API_BASE_URL
}
function getModel () {
  return process.env.AI_MODEL_NAME || 'Feedback bot'
}
function getApiKey () {
  return process.env.AI_API_KEY
}

// Helper to ensure API URL availability
function requireApiUrl () {
  if (!getBaseUrl()) {
    const err = new Error('AI_API_BASE_URL is not configured yet')
    err.status = 501
    throw err
  }
}

// Compose a prompt with optional controls
function buildPrompt ({ message, context, tone, language }) {
  const parts = []
  if (language) parts.push(`Respond in ${language}.`)
  if (tone) parts.push(`Tone: ${tone}.`)
  if (context) parts.push(`Context: ${context}`)
  parts.push(`Message: ${message}`)
  return parts.join('\n')
}

// Basic headers builder
function buildHeaders () {
  const headers = { 'Content-Type': 'application/json' }
  // Native Ollama typically doesn't require an API key, but support optional bearer
  const key = getApiKey()
  if (key) headers.Authorization = `Bearer ${key}`
  return headers
}

export const aiClient = {
  async generate ({ message, context, tone, language, options }) {
    // If not configured yet, return 501 so the server still runs
    requireApiUrl()

    const prompt = buildPrompt({ message, context, tone, language })

    // Native Ollama chat endpoint
    // POST {BASE_URL}/api/chat
    const url = `${getBaseUrl().replace(/\/$/, '')}/api/chat`

    const body = {
      model: getModel(),
      messages: [
        { role: 'system', content: 'You are an AI-driven automated feedback response generator.' },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.3,
        num_predict: options?.max_tokens ?? 400
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const err = new Error(`Upstream error ${res.status}: ${text}`)
      err.status = 502
      throw err
    }

    const data = await res.json()
    // Ollama /api/chat non-streaming returns an object with `message.content`
    const output = data?.message?.content ?? ''
    return {
      id: data?.id || `req_${Date.now()}`,
      model: getModel(),
      output,
      usage: {
        prompt_tokens: data?.prompt_eval_count ?? 0,
        completion_tokens: data?.eval_count ?? 0,
        total_tokens: (data?.prompt_eval_count ?? 0) + (data?.eval_count ?? 0)
      }
    }
  },

  async stream ({ message, context, tone, language }, { onChunk, onDone, onError }) {
    try {
      requireApiUrl()
      const prompt = buildPrompt({ message, context, tone, language })
      const url = `${getBaseUrl().replace(/\/$/, '')}/api/chat`

      const body = {
        model: getModel(),
        messages: [
          { role: 'system', content: 'You are an AI-driven automated feedback response generator.' },
          { role: 'user', content: prompt }
        ],
        stream: true,
        options: {
          temperature: 0.3,
          num_predict: 400
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body)
      })

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '')
        throw new Error(`Upstream error ${res.status}: ${text}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Ollama streaming returns NDJSON, one JSON object per line
        const lines = buffer.split('\n')
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()
          if (!line) continue
          try {
            const json = JSON.parse(line)
            if (json?.message?.content) onChunk(json.message.content)
            if (json?.done) {
              onDone({ model: getModel() })
              return
            }
          } catch {}
        }
        buffer = lines[lines.length - 1]
      }
      onDone({ model: getModel() })
    } catch (err) {
      onError?.(err)
    }
  }
}
