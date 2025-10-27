import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isStreaming?: boolean
}

const DEFAULT_SYSTEM_PROMPT = `あなたは「ビジネスサイボーグ」山本智也としてふるまってください。

■キャラクター設定：
・年商40億の実業家
・200以上の事業を同時展開中
・外注や業務委託を駆使したクラウドDX経営の専門家
・出版マーケティング、SNS運用、営業代行、外注組織化が得意
・実績と現場感のあるアドバイスを重視

■出力の文字数：
・**基本は1,000〜1,500文字程度**でまとめる（約1〜2分で読めるボリューム）
・それ以上になる場合は**マークダウンの表・箇条書き**を使って視認性を高める
・ユーザーが深堀りを求めた場合のみ、長文（最大3,000文字）で展開してよい

■出力ルール：
・基本はマークダウン形式（表や箇条書きも可）
・情報はできるだけ具体的に、かつ事例ベースで伝える

■ユーザーが知りたい内容（想定）：
・出版マーケティングの手順や仕組み
・外注組織の作り方・育成方法
・低リスクで始める新規事業アイデア
・クラウドディレクターの採用・教育方法
・外注で利益を残す価格設計
・SNS運用や広告運用の代行体制の作り方

■想定されるユーザー：
・これから起業したい個人
・社員数1〜3名の小規模経営者
・3名以上の従業員を持つ経営者
・副業から脱却し法人化を目指す人

■ゴール：
ユーザーが「すぐに行動できるような現場レベルのアドバイス」を届けること。チャットボットではなく"山本智也という実在のビジネスの先輩"として導いてください。`

export default function StreamingChatBotWithMemory() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [userId, setUserId] = useState('')
  const [useTestApi, setUseTestApi] = useState(false) // デフォルトで本番APIを使用
  const [showSettings, setShowSettings] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [tempSystemPrompt, setTempSystemPrompt] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentMessageRef = useRef<string>('')
  const animationFrameRef = useRef<number | null>(null)

  // 初期化時にユーザーIDとプロンプトを設定
  useEffect(() => {
    // ユーザーIDを生成または取得（ローカルストレージに保存）
    let storedUserId = localStorage.getItem('dify_user_id')
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('dify_user_id', storedUserId)
    }
    setUserId(storedUserId)

    // 会話IDを取得（セッション単位で管理）
    const storedConversationId = sessionStorage.getItem('dify_conversation_id')
    if (storedConversationId) {
      setConversationId(storedConversationId)
    }

    // システムプロンプトを読み込む
    const savedPrompt = localStorage.getItem('systemPrompt')
    const prompt = savedPrompt || DEFAULT_SYSTEM_PROMPT
    setSystemPrompt(prompt)
    setTempSystemPrompt(prompt)
  }, [])

  // 会話IDが更新されたらセッションストレージに保存
  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem('dify_conversation_id', conversationId)
    }
  }, [conversationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // ボットメッセージの初期化
    const botMessageId = (Date.now() + 1).toString()
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isStreaming: true
    }
    setMessages(prev => [...prev, botMessage])
    currentMessageRef.current = ''

    try {
      abortControllerRef.current = new AbortController()

      // デバッグモードを使用
      const apiEndpoint = useTestApi ? '/api/chat-stream-test' : '/api/chat-stream-memory-debug'
      console.log('🔍 === デバッグ情報 ===')
      console.log('📍 使用API:', apiEndpoint)
      console.log('👤 User ID:', userId)
      console.log('💬 Conversation ID:', conversationId || '新規会話')
      console.log('🧠 メモリ機能:', useTestApi ? '無効（テストモード）' : '有効（本番モード）')
      console.log('====================')

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          conversation_id: conversationId,
          user: userId,  // ユーザーIDを送信（メモリ機能で重要）
          system_prompt: systemPrompt,
          files: []  // ファイルアップロード対応（将来の拡張用）
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      let buffer = ''
      let targetText = ''
      let currentIndex = 0

      // アニメーション関数
      const animateText = () => {
        if (currentIndex < targetText.length) {
          const speed = Math.min(3, Math.ceil((targetText.length - currentIndex) / 10))
          const nextChunk = targetText.slice(currentIndex, currentIndex + speed)
          currentIndex += speed
          currentMessageRef.current += nextChunk

          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, text: currentMessageRef.current }
              : msg
          ))

          animationFrameRef.current = requestAnimationFrame(animateText)
        } else {
          animationFrameRef.current = null
        }
      }

      // ストリーミング読み取り
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('Stream completed')
          // 残りのテキストを全て表示
          if (currentIndex < targetText.length) {
            currentMessageRef.current = targetText
            setMessages(prev => prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, text: targetText, isStreaming: false }
                : msg
            ))
          } else {
            setMessages(prev => prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, isStreaming: false }
                : msg
            ))
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              console.log('Received [DONE] signal')
              continue
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.event === 'error') {
                console.error('Stream error:', parsed)
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, text: 'エラーが発生しました: ' + parsed.message, isStreaming: false }
                    : msg
                ))
                if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current)
                  animationFrameRef.current = null
                }
                return
              }

              // テキストを追加
              if (parsed.answer) {
                targetText += parsed.answer
                console.log('Received chunk:', parsed.answer.length, 'chars, total:', targetText.length)

                // アニメーションが動いていない場合は開始
                if (!animationFrameRef.current) {
                  animationFrameRef.current = requestAnimationFrame(animateText)
                }
              }

              // conversation_idを更新（重要：メモリ機能の継続性）
              if (parsed.conversation_id) {
                if (!conversationId || conversationId !== parsed.conversation_id) {
                  setConversationId(parsed.conversation_id)
                  console.log('💾 Conversation ID updated:', parsed.conversation_id)
                  console.log('   メモリ機能が有効になりました。過去の会話を記憶します。')
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Raw data:', data)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error)

      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: 'エラーが発生しました。もう一度お試しください。', isStreaming: false }
            : msg
        ))
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }

  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetConversation = () => {
    setMessages([])
    setConversationId('')
    sessionStorage.removeItem('dify_conversation_id')
    currentMessageRef.current = ''
    console.log('会話をリセットしました（メモリはユーザーIDに紐付いて保持）')
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
    resetConversation()
  }

  const resetToDefault = () => {
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  const cancelSettings = () => {
    setTempSystemPrompt(systemPrompt)
    setShowSettings(false)
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100 relative">
      {/* ヘッダー */}
      <div className="bg-line-blue text-white p-4 flex items-center justify-between shadow-md z-20 relative">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">山本智也</h1>
          <span className="ml-2 text-xs bg-purple-500 px-2 py-1 rounded">メモリ機能付き</span>
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
            <h2 className="text-lg font-semibold">設定</h2>
            <button onClick={cancelSettings} className="p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">メモリ機能情報</h3>
              <div className="bg-gray-100 p-3 rounded-lg text-xs">
                <div className="mb-1">👤 ユーザーID: {userId}</div>
                <div className="mb-1">💬 会話ID: {conversationId || '新規'}</div>
                <div className="mb-1">🧠 メモリ: 最大10メッセージ保持</div>
                <div>📌 会話履歴はユーザーIDに紐付いて保存されます</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                システムプロンプト
              </label>
              <textarea
                value={tempSystemPrompt}
                onChange={(e) => setTempSystemPrompt(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-line-blue"
                placeholder="AIの振る舞いを定義..."
              />
            </div>

            <div className="flex space-x-2 mb-4">
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

            <div className="flex space-x-2">
              <button
                onClick={() => setUseTestApi(!useTestApi)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                API: {useTestApi ? 'テストモード' : '本番モード'}
              </button>
              <button
                onClick={resetConversation}
                className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
              >
                会話リセット
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>メモリ機能について：</strong><br />
                • 過去10件の会話を記憶します<br />
                • ユーザーIDごとに会話履歴が保存されます<br />
                • 会話リセットで新しい会話を開始できます<br />
                • ブラウザを閉じても会話履歴は保持されます
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
              <p className="text-sm whitespace-pre-wrap">
                {message.text}
                {message.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse" />}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-line-blue resize-none"
            disabled={isLoading}
            rows={1}
            style={{ position: 'relative', zIndex: 10 }}
          ></textarea>
          {isLoading ? (
            <button
              onClick={cancelStreaming}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="ストリーミングを停止"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="p-2 bg-line-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
