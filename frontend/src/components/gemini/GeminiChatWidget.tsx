import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, Bot, User, Loader2, Globe, AlertTriangle } from 'lucide-react'
import { chatService } from '@/services/chatService'

type Message = {
  sender: 'user' | 'bot'
  text: string
  isSanitized?: boolean
}

type GeminiPart = {
  text: string
}

type GeminiContent = {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export default function GeminiChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu **Copiloto Clínico Gemini**. Estoy respaldado por el **Motor de Búsqueda de Google** para investigar información médica en tiempo real.\n\n*¿En qué puedo asistirte hoy?* Puedes preguntarme sobre dosificaciones de fármacos, guías clínicas recientes, diagnósticos diferenciales o interacciones farmacológicas.'
    }
  ])
  const [history, setHistory] = useState<GeminiContent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sanitizedAlert, setSanitizedAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Suggested prompt chips
  const suggestionChips = [
    { label: '💊 Interacción de Fármacos', prompt: '¿Existe alguna interacción clínica relevante entre Metformina y Alopurinol en un paciente geriátrico?' },
    { label: '🔬 Diagnóstico Diferencial', prompt: 'Sugiere diagnósticos diferenciales para un paciente de 35 años con fiebre persistente, fatiga y linfadenopatías cervicales bilaterales.' },
    { label: '🧬 Guías de Hipertensión', prompt: '¿Cuáles son las directrices más recientes para el tratamiento de la hipertensión gestacional de acuerdo a las últimas guías clínicas?' },
    { label: '📑 Dosis Pediátrica', prompt: '¿Cuál es el esquema de dosificación sugerido para Amoxicilina en un infante de 14 kg para tratar una otitis media aguda?' }
  ]

  // PHI Sanitization Filter (Real-time local privacy check)
  const sanitizePrompt = (text: string): { sanitized: string; triggered: boolean } => {
    let sanitized = text
    let triggered = false

    // 1. Cédulas / IDs (7 to 10 digits)
    const idRegex = /\b\d{7,10}\b/g
    if (idRegex.test(sanitized)) {
      sanitized = sanitized.replace(idRegex, '[CÉDULA SANITIZADA]')
      triggered = true
    }

    // 2. Phone Numbers
    const phoneRegex = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    if (phoneRegex.test(sanitized)) {
      sanitized = sanitized.replace(phoneRegex, '[TELÉFONO SANITIZADO]')
      triggered = true
    }

    // 3. Complete names with triggers
    const nameTriggers = [
      /llamado\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)/gi,
      /llamada\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)/gi,
      /paciente\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)/gi,
      /sr\.\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)/gi,
      /sra\.\s+([A-ZÁÉÍÓÚ][a-zñáéíóú]+\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)/gi
    ]

    nameTriggers.forEach(regex => {
      if (regex.test(sanitized)) {
        sanitized = sanitized.replace(regex, (match) => {
          const word = match.split(' ')[0]
          return `${word} [PACIENTE SANITIZADO]`
        })
        triggered = true
      }
    })

    return { sanitized, triggered }
  }

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return

    setIsLoading(true)
    setErrorMessage(null)
    setSanitizedAlert(false)

    // Apply privacy filter
    const { sanitized, triggered } = sanitizePrompt(textToSend)
    if (triggered) {
      setSanitizedAlert(true)
    }

    // Append user message to UI
    const newUserMessage: Message = {
      sender: 'user',
      text: textToSend,
      isSanitized: triggered
    }
    setMessages(prev => [...prev, newUserMessage])
    setPrompt('')

    try {
      // Send to Go backend
      const result = await chatService.sendMessage(sanitized, history)

      // Append bot response to UI
      setMessages(prev => [...prev, { sender: 'bot', text: result.response }])

      // Update history in Gemini standard structure
      setHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: sanitized }] },
        { role: 'model', parts: [{ text: result.response }] }
      ])
    } catch (err: any) {
      console.error('Error in Gemini Assistant:', err)
      const errorText = err.response?.data?.error || 'Hubo un problema al conectar con el asistente clínico de Gemini. Por favor, intenta de nuevo.'
      setErrorMessage(errorText)
    } finally {
      setIsLoading(false)
    }
  }

  // Custom Inline Markdown Renderer for citations, lists, and bold formats
  const renderMarkdown = (text: string) => {
    if (!text) return null

    const lines = text.split('\n')
    return lines.map((line, idx) => {
      let cleanLine = line
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*')
      if (isBullet) {
        cleanLine = line.trim().substring(1).trim()
      }

      const boldRegex = /\*\*(.*?)\*\*/g
      const linkRegex = /\[(.*?)\]\((.*?)\)/g

      const parseInline = (str: string): React.ReactNode => {
        const boldParts: { text: string; isBold: boolean }[] = []
        let bMatch
        let bLastIndex = 0
        while ((bMatch = boldRegex.exec(str)) !== null) {
          if (bMatch.index > bLastIndex) {
            boldParts.push({ text: str.substring(bLastIndex, bMatch.index), isBold: false })
          }
          boldParts.push({ text: bMatch[1], isBold: true })
          bLastIndex = boldRegex.lastIndex
        }
        if (bLastIndex < str.length) {
          boldParts.push({ text: str.substring(bLastIndex), isBold: false })
        }

        return boldParts.map((bp, bpIdx) => {
          if (bp.isBold) {
            return <strong key={bpIdx} className="font-bold text-slate-800 dark:text-slate-100">{bp.text}</strong>
          }

          let lMatch
          let lLastIndex = 0
          const inlineElements: React.ReactNode[] = []
          while ((lMatch = linkRegex.exec(bp.text)) !== null) {
            if (lMatch.index > lLastIndex) {
              inlineElements.push(bp.text.substring(lLastIndex, lMatch.index))
            }
            inlineElements.push(
              <a
                key={lMatch.index}
                href={lMatch[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5"
              >
                {lMatch[1]}
              </a>
            )
            lLastIndex = linkRegex.lastIndex
          }
          if (lLastIndex < bp.text.length) {
            inlineElements.push(bp.text.substring(lLastIndex))
          }

          return <span key={bpIdx}>{inlineElements}</span>
        })
      }

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-1.5">
            {parseInline(cleanLine)}
          </li>
        )
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />
      }

      return (
        <p key={idx} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-2">
          {parseInline(line)}
        </p>
      )
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Chat Trigger Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative group animate-bounce"
          title="Consultar a Gemini"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
          </span>
          {/* Tooltip on hover */}
          <span className="absolute right-16 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md pointer-events-none">
            Asistente Clínico Gemini
          </span>
        </button>
      )}

      {/* Main Chat Panel Container */}
      {isOpen && (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Copiloto Gemini
                </h3>
                <p className="text-[10px] text-indigo-200 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  BÚSQUEDA WEB ACTIVA (GOOGLE)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 hover:cursor-pointer rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Conversational Window */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300'
                      : 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl shadow-sm text-sm border ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-primary to-indigo-600 text-white border-primary/20 rounded-tr-none'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-600 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}
                  </div>

                  {/* Sanitized Message Notice */}
                  {msg.isSanitized && msg.sender === 'user' && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 px-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                      Sanitizado localmente (PHIFilter)
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator with Grounding Action */}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-sm shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 animate-pulse text-emerald-500 dark:text-emerald-400" />
                    Investigando en internet de Google...
                  </p>
                </div>
              </div>
            )}

            {/* Error Message display */}
            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 p-4 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex gap-2.5 shadow-sm animate-in fade-in duration-300">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Error del Copiloto Gemini</p>
                  <p className="leading-relaxed leading-tighter text-slate-600 dark:text-slate-300">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Real-time local PHI Trigger Notification */}
            {sanitizedAlert && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex gap-2.5 shadow-sm animate-in fade-in duration-300">
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Privacidad Médica Protegida</p>
                  <p className="text-slate-600 dark:text-slate-300 leading-normal">
                    Se detectaron datos que pueden identificar al paciente (como nombres o IDs). Han sido eliminados o reemplazados localmente antes de enviar la pregunta.
                  </p>
                </div>
              </div>
            )}

            {/* Empty history suggest chips */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                  Sugerencias de Investigación
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip.prompt)}
                      className="px-3.5 py-2 bg-white dark:bg-slate-700 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-blue-400 hover:border-primary/20 dark:hover:border-primary/30 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all text-left shadow-sm active:scale-95 hover:cursor-pointer block w-full"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Pregunta a Gemini (ej: interacciones farmacológicas)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSend(prompt)
                }
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSend(prompt)}
              disabled={isLoading || !prompt.trim()}
              className="p-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Enviar pregunta"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
