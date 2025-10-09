import React, { useState, useEffect } from 'react'
import { X, Save, RotateCcw, Sparkles } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  botType: string
  onSave: (prompt: string) => void
}

// プリセットプロンプト
const PRESET_PROMPTS: Record<string, { name: string; prompt: string }> = {
  none: {
    name: 'プリセットなし',
    prompt: ''
  },
  default: {
    name: 'デフォルト',
    prompt: 'あなたは親切で知識豊富なAIアシスタントです。ユーザーの質問に対して、正確で役立つ情報を提供してください。'
  },
  professional: {
    name: 'プロフェッショナル',
    prompt: 'あなたはビジネスの専門家です。フォーマルで専門的な口調で、ビジネスに関する質問に答えてください。敬語を使い、具体的なアドバイスを提供してください。'
  },
  friendly: {
    name: 'フレンドリー',
    prompt: 'あなたは親しみやすい友人のようなアシスタントです。カジュアルな口調で、絵文字も使いながら楽しく会話してください。😊'
  },
  teacher: {
    name: '先生モード',
    prompt: 'あなたは優秀な教師です。物事をわかりやすく説明し、例を使って理解を助けてください。生徒の学習を促進するような質問も投げかけてください。'
  },
  creative: {
    name: 'クリエイティブ',
    prompt: 'あなたは創造的なアイデアを生み出すアシスタントです。独創的で革新的な提案をし、既成概念にとらわれない発想で回答してください。'
  },
  technical: {
    name: 'テクニカル',
    prompt: 'あなたは技術の専門家です。プログラミング、IT、エンジニアリングに関する質問に、技術的な詳細を含めて正確に回答してください。コード例も提供してください。'
  }
}

// X投稿用プリセット
const X_PRESET_PROMPTS: Record<string, { name: string; prompt: string }> = {
  none: {
    name: 'プリセットなし',
    prompt: ''
  },
  viral: {
    name: 'バズ狙い',
    prompt: 'バズりやすいX（Twitter）の投稿を作成してください。トレンドを意識し、共感を呼ぶ内容で、リツイートされやすい文章を心がけてください。適切なハッシュタグも提案してください。'
  },
  business: {
    name: 'ビジネス告知',
    prompt: 'ビジネス向けのプロフェッショナルなX投稿を作成してください。情報を簡潔にまとめ、CTAを含め、フォロワーのエンゲージメントを促進する内容にしてください。'
  },
  casual: {
    name: 'カジュアル',
    prompt: 'カジュアルで親しみやすいX投稿を作成してください。日常的な話題で、フォロワーとの距離を縮めるような内容にしてください。'
  }
}

// Facebook投稿用プリセット
const FACEBOOK_PRESET_PROMPTS: Record<string, { name: string; prompt: string }> = {
  none: {
    name: 'プリセットなし',
    prompt: ''
  },
  engagement: {
    name: 'エンゲージメント重視',
    prompt: 'Facebookでエンゲージメントを高める投稿を作成してください。質問を投げかけ、コメントを促し、「いいね」やシェアをしてもらいやすい内容にしてください。'
  },
  storytelling: {
    name: 'ストーリーテリング',
    prompt: 'ストーリー性のあるFacebook投稿を作成してください。読者の感情に訴えかけ、共感を呼ぶような物語形式で書いてください。'
  },
  informative: {
    name: '情報提供',
    prompt: '有益な情報を提供するFacebook投稿を作成してください。読者にとって価値のある知識やTipsを、わかりやすく整理して伝えてください。'
  }
}

// プロフィール用プリセット
const PROFILE_PRESET_PROMPTS: Record<string, { name: string; prompt: string }> = {
  none: {
    name: 'プリセットなし',
    prompt: ''
  },
  professional: {
    name: 'プロフェッショナル',
    prompt: 'LinkedInやビジネス向けのプロフェッショナルな自己紹介文を作成してください。実績、スキル、経験を強調し、信頼性を高める内容にしてください。'
  },
  creative: {
    name: 'クリエイティブ',
    prompt: '創造的で個性的な自己紹介文を作成してください。独自性を前面に出し、記憶に残るプロフィールにしてください。'
  },
  concise: {
    name: '簡潔',
    prompt: '簡潔で要点をまとめた自己紹介文を作成してください。最も重要な情報だけを含め、読みやすい形式にしてください。'
  }
}

// チャットボットの性格プリセット
const CHATBOT_PERSONALITIES = [
  {
    key: 'default',
    label: 'デフォルト',
    description: '状況に合わせてバランスよく対応する標準的なトーンです。',
    prompt: ''
  },
  {
    key: 'friendly',
    label: 'フレンドリー',
    description: '親しみやすくおしゃべりな口調で、絵文字も交えて回答します。',
    prompt: '会話は親しみやすく、温かみのあるトーンで行い、適宜絵文字も使用してください。'
  },
  {
    key: 'professional',
    label: 'プロフェッショナル',
    description: 'ビジネスやフォーマルな場面にふさわしい落ち着いた語り口です。',
    prompt: 'ビジネスの専門家として落ち着いたフォーマルなトーンで回答し、根拠を明確に示してください。'
  },
  {
    key: 'teacher',
    label: '先生モード',
    description: '解説を交えながら丁寧に導く教師のようなスタイルです。',
    prompt: '優秀な教師として、具体例と補足説明を交えながら丁寧に解説してください。'
  },
  {
    key: 'creative',
    label: 'クリエイティブ',
    description: '自由な発想とアイデアで会話を盛り上げます。',
    prompt: '創造的な視点を積極的に取り入れ、独創的な提案を行ってください。'
  },
  {
    key: 'technical',
    label: 'テクニカル',
    description: '専門用語と根拠を意識した技術寄りのスタイルです。',
    prompt: '技術的な背景や根拠を明示しながら、専門家として詳細に回答してください。'
  }
]

// カスタム指示タグ
const INSTRUCTION_TAGS = [
  {
    key: 'chatty',
    label: 'おしゃべり',
    prompt: '会話は親しみやすく、おしゃべりなテンポで進めてください。'
  },
  {
    key: 'witty',
    label: '機知に富む',
    prompt: 'ユーモアと機知を交え、知的なコメントを添えてください。'
  },
  {
    key: 'direct',
    label: '率直',
    prompt: '結論を先に述べ、率直かつ明確に回答してください。'
  },
  {
    key: 'encourage',
    label: '励まし',
    prompt: '相手を励ます言葉を意識して、ポジティブなフィードバックを添えてください。'
  },
  {
    key: 'genZ',
    label: 'Z世代',
    prompt: 'Z世代らしいカジュアルな表現やトレンドの用語を適度に取り入れてください。'
  },
  {
    key: 'polite',
    label: '丁寧',
    prompt: '丁寧語と敬語を用い、礼儀正しく回答してください。'
  },
  {
    key: 'concise',
    label: '簡潔',
    prompt: '要点を短くまとめ、冗長な表現は避けてください。'
  }
]

interface CustomSettings {
  presetKey: string
  customInstructions: string
  personalityKey: string
  instructionTagKeys: string[]
  nickname: string
  profession: string
  aboutDetails: string
  compiledPrompt: string
}

export default function SettingsModal({ isOpen, onClose, botType, onSave }: SettingsModalProps) {
  const [customInstructions, setCustomInstructions] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('none')
  const [personalityKey, setPersonalityKey] = useState('default')
  const [selectedInstructionTags, setSelectedInstructionTags] = useState<string[]>([])
  const [nickname, setNickname] = useState('')
  const [profession, setProfession] = useState('')
  const [aboutDetails, setAboutDetails] = useState('')

  // ボットタイプに応じたプリセットを取得
  const getPresets = () => {
    switch (botType) {
      case 'x':
        return X_PRESET_PROMPTS
      case 'facebook':
        return FACEBOOK_PRESET_PROMPTS
      case 'profile':
        return PROFILE_PRESET_PROMPTS
      default:
        return PRESET_PROMPTS
    }
  }

  const presets = getPresets() as Record<string, { name: string; prompt: string }>
  const selectedPersonality = CHATBOT_PERSONALITIES.find(item => item.key === personalityKey)

  const buildCompiledPrompt = (
    presetKey: string,
    instructions: string,
    personality: string,
    instructionTags: string[],
    nicknameValue: string,
    professionValue: string,
    aboutValue: string
  ) => {
    const parts: string[] = []
    const preset = presetKey !== 'none' ? presets[presetKey] : null
    const instructionText = instructions.trim()
    if (instructionText) {
      parts.push(instructionText)
    } else if (preset?.prompt) {
      parts.push(preset.prompt.trim())
    }

    const personalityPreset = CHATBOT_PERSONALITIES.find(item => item.key === personality)
    if (personalityPreset?.prompt) {
      parts.push(personalityPreset.prompt.trim())
    }

    if (instructionTags.length > 0) {
      const tagPrompts = instructionTags
        .map(tagKey => INSTRUCTION_TAGS.find(tag => tag.key === tagKey)?.prompt?.trim())
        .filter((prompt): prompt is string => Boolean(prompt))

      if (tagPrompts.length > 0) {
        parts.push(tagPrompts.join('\n'))
      }
    }

    const profileLines: string[] = []
    if (nicknameValue.trim()) {
      profileLines.push(`ニックネーム: ${nicknameValue.trim()}`)
    }
    if (professionValue.trim()) {
      profileLines.push(`職業: ${professionValue.trim()}`)
    }
    if (aboutValue.trim()) {
      profileLines.push(`詳細: ${aboutValue.trim()}`)
    }
    if (profileLines.length > 0) {
      parts.push(`ユーザープロフィール:\n${profileLines.join('\n')}`)
    }

    return parts.join('\n\n').trim()
  }

  // 初期化：保存された設定を読み込み
  useEffect(() => {
    if (!isOpen) return

    const settingsRaw = localStorage.getItem(`customSettings_${botType}`)

    if (settingsRaw) {
      try {
        const parsed = JSON.parse(settingsRaw) as CustomSettings

        setSelectedPreset(parsed.presetKey || 'none')
        setCustomInstructions(parsed.customInstructions || '')
        setPersonalityKey(parsed.personalityKey || 'default')
        setSelectedInstructionTags(parsed.instructionTagKeys || [])
        setNickname(parsed.nickname || '')
        setProfession(parsed.profession || '')
        setAboutDetails(parsed.aboutDetails || '')
        return
      } catch (error) {
        console.warn('Failed to parse saved custom settings:', error)
      }
    }

    // 旧形式（文字列のみ）の互換対応
    const legacyPrompt = localStorage.getItem(`customPrompt_${botType}`)
    if (legacyPrompt) {
      setSelectedPreset('none')
      setCustomInstructions(legacyPrompt)
      setPersonalityKey('default')
      setSelectedInstructionTags([])
      setNickname('')
      setProfession('')
      setAboutDetails('')
      return
    }

    // プリセットなしで初期化
    setSelectedPreset('none')
    setCustomInstructions('')
    setPersonalityKey('default')
    setSelectedInstructionTags([])
    setNickname('')
    setProfession('')
    setAboutDetails('')
  }, [isOpen, botType])

  // プリセット選択時の処理
  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey)
    const preset = presets[presetKey]
    if (presetKey !== 'none' && preset?.prompt) {
      setCustomInstructions(preset.prompt)
    } else if (presetKey === 'none') {
      setCustomInstructions('')
    }
  }

  const toggleInstructionTag = (tagKey: string) => {
    setSelectedInstructionTags(prev =>
      prev.includes(tagKey)
        ? prev.filter(key => key !== tagKey)
        : [...prev, tagKey]
    )
  }

  // 保存処理
  const handleSave = () => {
    const compiledPrompt = buildCompiledPrompt(
      selectedPreset,
      customInstructions,
      personalityKey,
      selectedInstructionTags,
      nickname,
      profession,
      aboutDetails
    )

    const settingsToSave: CustomSettings = {
      presetKey: selectedPreset,
      customInstructions,
      personalityKey,
      instructionTagKeys: selectedInstructionTags,
      nickname,
      profession,
      aboutDetails,
      compiledPrompt
    }

    localStorage.setItem(`customSettings_${botType}`, JSON.stringify(settingsToSave))
    localStorage.setItem(`customPrompt_${botType}`, compiledPrompt)
    onSave(compiledPrompt)
    onClose()
  }

  // リセット処理
  const handleReset = () => {
    setSelectedPreset('none')
    setCustomInstructions('')
    setPersonalityKey('default')
    setSelectedInstructionTags([])
    setNickname('')
    setProfession('')
    setAboutDetails('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">カスタムプロンプト設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 説明 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              AIの振る舞いや応答スタイルをカスタマイズできます。
              プリセットから選択するか、独自のプロンプトを入力してください。
            </p>
          </div>

          {/* プリセット選択 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">プリセット</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedPreset === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">
                    {preset.name}
                  </div>
                  {preset.prompt && (
                    <p className="mt-1 text-xs text-gray-500 overflow-hidden max-h-14">
                      {preset.prompt}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* チャットボットの性格 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">チャットボットの性格</h3>
            <select
              value={personalityKey}
              onChange={(e) => setPersonalityKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {CHATBOT_PERSONALITIES.map(personality => (
                <option key={personality.key} value={personality.key}>
                  {personality.label}
                </option>
              ))}
            </select>
            {selectedPersonality && (
              <p className="mt-2 text-xs text-gray-500">
                {selectedPersonality.description}
              </p>
            )}
          </div>

          {/* カスタム指示 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">カスタム指示</h3>
              <span className="text-xs text-gray-500">
                {customInstructions.length} / 1000 文字
              </span>
            </div>
            <textarea
              value={customInstructions}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setCustomInstructions(e.target.value)
                }
              }}
              placeholder="AIの振る舞いや口調、回答形式などを詳しく指定してください..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {INSTRUCTION_TAGS.map(tag => {
                const isSelected = selectedInstructionTags.includes(tag.key)
                return (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => toggleInstructionTag(tag.key)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* あなたについて */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">あなたについて</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ニックネーム</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="会社名 など"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">職業</label>
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="経営者 / マーケター など"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">あなたについての詳細</label>
              <textarea
                value={aboutDetails}
                onChange={(e) => {
                  if (e.target.value.length <= 600) {
                    setAboutDetails(e.target.value)
                  }
                }}
                placeholder="得意分野、価値観、現在の課題などを記入してください。"
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
            </div>
          </div>

          {/* 例 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 ヒント</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 具体的な役割や専門性を定義する</li>
              <li>• 口調やトーンを指定する（フォーマル、カジュアルなど）</li>
              <li>• 応答の長さや詳細度を指定する</li>
              <li>• 特定の知識領域や制約を設定する</li>
            </ul>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>リセット</span>
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
