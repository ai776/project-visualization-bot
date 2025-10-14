import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, Settings, Send, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import SettingsModal from './SettingsModal'

// ボットタイプの定義
export type BotType = 'project-visualizer'

interface Bot {
  id: BotType
  name: string
  icon: React.ReactNode
  description: string
  placeholder: string
  apiEndpoint: string
}

// 利用可能なボット一覧
const AVAILABLE_BOTS: Bot[] = [
  {
    id: 'project-visualizer',
    name: 'プロジェクト可視化ボット',
    icon: <MessageCircle className="w-6 h-6" />,
    description: 'プロジェクトの構成・タスク・依存関係の可視化支援',
    placeholder: 'プロジェクトの概要やタスクを入力してください...',
    apiEndpoint: '/api/chat-stream'
  }
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  botType: BotType
}

export default function MultiBotSelector() {
  const [selectedBot, setSelectedBot] = useState<BotType>('project-visualizer')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ユーザーIDの初期化（メモリ機能用）
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (!storedUserId) {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('userId', newUserId)
      setUserId(newUserId)
    } else {
      setUserId(storedUserId)
    }
  }, [])

  // ボット切り替え時の処理
  useEffect(() => {
    // ボットごとに異なるconversation_idを管理
    const botConversationKey = `conversationId_${selectedBot}`
    const storedConversationId = sessionStorage.getItem(botConversationKey)
    setConversationId(storedConversationId)

    // 新フォーマットのカスタム設定を読み込み
    const savedSettings = localStorage.getItem(`customSettings_${selectedBot}`)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as { compiledPrompt?: string; customInstructions?: string }
        if (parsed?.compiledPrompt) {
          setCustomPrompt(parsed.compiledPrompt)
          return
        }
        if (parsed?.customInstructions) {
          setCustomPrompt(parsed.customInstructions)
          return
        }
      } catch (error) {
        console.warn('Failed to parse custom settings:', error)
      }
    }

    // 旧フォーマット（文字列のみ）を読み込み
    const savedPrompt = localStorage.getItem(`customPrompt_${selectedBot}`)
    if (savedPrompt) {
      setCustomPrompt(savedPrompt)
    } else {
      setCustomPrompt('')
    }
  }, [selectedBot])

  // 現在選択されているボットの情報を取得
  const currentBot = AVAILABLE_BOTS.find(bot => bot.id === selectedBot)!

  // スクロール制御
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // メッセージ送信処理
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      botType: selectedBot
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 新しいAbortControllerを作成（既存があればキャンセル）
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const streamingMessageId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      botType: selectedBot
    }
    setMessages(prev => [...prev, streamingMessage])

    try {
      const response = await fetch(currentBot.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId,
          user: userId,
          system_prompt: customPrompt || undefined
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
                  message.id === streamingMessageId
                    ? { ...message, content: accumulatedText }
                    : message
                )
              )
            } else if (parsed.event === 'message_end') {
              if (parsed.conversation_id) {
                const botConversationKey = `conversationId_${selectedBot}`
                sessionStorage.setItem(botConversationKey, parsed.conversation_id)
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
            message.id === streamingMessageId
              ? { ...message, content: '応答を取得できませんでした。' }
              : message
          )
        )
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
        setMessages(prev => prev.filter(message => message.id !== streamingMessageId))
      } else {
        console.error('Error:', error)
        setMessages(prev =>
          prev.map(message =>
            message.id === streamingMessageId
              ? { ...message, content: 'エラーが発生しました。もう一度お試しください。' }
              : message
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // 会話リセット
  const resetConversation = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    const botConversationKey = `conversationId_${selectedBot}`
    sessionStorage.removeItem(botConversationKey)
    setConversationId(null)
    setMessages([])
  }

  // 現在のボットのメッセージのみをフィルタリング
  const filteredMessages = messages.filter(msg => msg.botType === selectedBot)

  // カスタムプロンプトの保存処理
  const handleSaveCustomPrompt = (prompt: string) => {
    setCustomPrompt(prompt)
  }

  return (
    <div
      className="flex flex-col h-[100dvh] md:h-[70vh] md:max-h-[70vh] md:min-h-[560px] bg-gray-50 w-full md:max-w-md md:mx-auto md:my-8 md:rounded-3xl md:border md:border-gray-200 md:shadow-lg overflow-y-auto md:overflow-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* ヘッダー：ボット選択 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 w-full">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsBotSelectorOpen(!isBotSelectorOpen)}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
            >
              <h1 className="text-lg md:text-2xl font-bold">
                {currentBot.name}
              </h1>
              {isBotSelectorOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="カスタムプロンプト設定"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </button>
          </div>

          {/* 開閉可能なボット選択エリア */}
          {isBotSelectorOpen && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 animate-slide-in-from-top">
              {AVAILABLE_BOTS.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    setSelectedBot(bot.id)
                    setIsBotSelectorOpen(false) // 選択後は自動で閉じる
                  }}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all ${selectedBot === bot.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <div className={`${selectedBot === bot.id ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {bot.icon}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-900">
                      {bot.name}
                    </div>
                    <div className="text-xs text-gray-500 hidden md:block">
                      {bot.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* チャットエリア */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full flex flex-col">
          {/* メッセージ表示エリア */}
          <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
            {filteredMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <div className="mb-4">{currentBot.icon}</div>
                <p className="text-lg font-medium">{currentBot.name}へようこそ</p>
                <p className="text-sm mt-2">{currentBot.description}</p>
              </div>
            )}

            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`max-w-2xl px-4 py-2 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}


            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div
            className="border-t bg-white p-4 sticky bottom-0 left-0 z-10"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
          >
            <div className="w-full">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={currentBot.placeholder}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="p-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  title="送信"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden md:inline">{isLoading ? '送信中...' : '送信'}</span>
                </button>
                <button
                  onClick={resetConversation}
                  className="p-2 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  title="会話をリセット"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="hidden md:inline">リセット</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        botType={selectedBot}
        onSave={handleSaveCustomPrompt}
      />
    </div>
  )
}
