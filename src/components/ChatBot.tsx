import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const DEFAULT_SYSTEM_PROMPT = `あなたは「プロジェクト可視化ボット」です。

ユーザーのプロジェクトの目的、関係者、タスク、期限、依存関係を丁寧に引き出し、構造化して提示してください。
必要に応じてWBS、マイルストーン、リスク、優先度、ガントチャート化に役立つ粒度で分解し、次に取るべき具体的アクションも提案してください。`

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [tempSystemPrompt, setTempSystemPrompt] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 初期化時にローカルストレージから設定を読み込む
  useEffect(() => {
    const savedPrompt = localStorage.getItem('systemPrompt')
    const prompt = savedPrompt || DEFAULT_SYSTEM_PROMPT
    setSystemPrompt(prompt)
    setTempSystemPrompt(prompt)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const sendMessage = async () => {
    const trimmed = inputText.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // 進行中のリクエストがあればキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setMessages(prev => [
      ...prev,
      {
        id: assistantMessageId,
        text: '',
        sender: 'bot',
        timestamp: new Date()
      }
    ])

    try {
      console.log('Sending message with conversation_id:', conversationId)

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId || undefined,
          system_prompt: systemPrompt || undefined
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let buffer = ''
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.event === 'message') {
              accumulatedText += parsed.answer || ''
              setMessages(prev =>
                prev.map(message =>
                  message.id === assistantMessageId
                    ? { ...message, text: accumulatedText }
                    : message
                )
              )
            } else if (parsed.event === 'message_end') {
              if (parsed.conversation_id) {
                console.log('Setting conversation_id to:', parsed.conversation_id)
                setConversationId(parsed.conversation_id)
              }
            } else if (parsed.event === 'error') {
              throw new Error(parsed.message || 'Streaming error')
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }

      if (!accumulatedText) {
        setMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId
              ? { ...message, text: '応答を取得できませんでした。' }
              : message
          )
        )
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
        setMessages(prev => prev.filter(message => message.id !== assistantMessageId))
      } else {
        console.error('Streaming error:', error)
        setMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId
              ? { ...message, text: 'エラーが発生しました。もう一度お試しください。' }
              : message
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
    if (!showSettings) {
      setTempSystemPrompt(systemPrompt)
    }
  }

  const saveSettings = () => {
    setSystemPrompt(tempSystemPrompt)
    localStorage.setItem('systemPrompt', tempSystemPrompt)
    setShowSettings(false)
    // 会話をリセット（新しいプロンプトで開始）
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessages([])
    setConversationId('')
  }

  const resetToDefault = () => {
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  const cancelSettings = () => {
    setTempSystemPrompt(systemPrompt)
    setShowSettings(false)
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-gray-100 md:bg-white relative h-[100dvh] md:h-[70vh] md:max-h-[70vh] md:min-h-[520px] md:rounded-3xl md:shadow-lg md:border md:border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-line-blue text-white p-4 flex items-center justify-between shadow-md z-20 relative">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">プロジェクト可視化ボット</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleSettings} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <div className="absolute inset-0 z-30 bg-white flex flex-col">
          <div className="bg-line-blue text-white p-4 flex items-center justify-between shadow-md">
            <h2 className="text-lg font-semibold">カスタムプロンプト設定</h2>
            <button onClick={cancelSettings} className="p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                システムプロンプト（AIの振る舞いを定義）
              </label>
              <textarea
                value={tempSystemPrompt}
                onChange={(e) => setTempSystemPrompt(e.target.value)}
                className="w-full h-96 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-line-blue"
                placeholder="AIの振る舞いを定義するプロンプトを入力..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={saveSettings}
                className="flex-1 bg-line-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                保存して適用
              </button>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                デフォルトに戻す
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>注意：</strong>プロンプトを保存すると現在の会話がリセットされます。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <div className="flex items-end mr-2">
                <div className="w-10 h-10 bg-line-blue rounded-full flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-3 rounded-2xl ${message.sender === 'user'
                ? 'bg-message-yellow text-gray-800'
                : 'bg-white text-gray-800 border border-gray-200'
                }`}
              style={{
                borderRadius: message.sender === 'user'
                  ? '18px 18px 4px 18px'
                  : '4px 18px 18px 18px'
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-line-blue"
            disabled={isLoading}
            style={{ position: 'relative', zIndex: 10 }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim()}
            className="p-2 bg-line-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
