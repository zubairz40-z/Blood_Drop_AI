import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Bot } from 'lucide-react'
import ChatMessage from './ChatMessage'
import SuggestedPrompts from './SuggestedPrompts'
import findResponse from '../../data/demoChatbotResponses'

const suggestedPrompts = [
  'How do I request blood?',
  'How do I become a donor?',
  'What donation types are supported?',
  'How can I track a request?',
]

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm the BloodDrop Assistant. I can help you understand requests, donation options, dashboards, and how BloodDrop works.",
}

function GeminiChatbot({ onClose }) {
  const [messages, setMessages] = useState([welcomeMessage])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSend(text) {
    const trimmed = (text || input).trim()
    if (!trimmed) return

    const userMsg = { id: 'user-' + Date.now(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const reply = findResponse(trimmed)
    const assistantMsg = { id: 'assistant-' + Date.now(), role: 'assistant', text: reply }
    setMessages((prev) => [...prev, assistantMsg])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] bg-bg border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden sm:bottom-20"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand">BloodDrop Assistant</p>
            <p className="text-[10px] text-text-muted">Demo conversation UI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-dark hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <SuggestedPrompts prompts={suggestedPrompts} onSelect={handleSend} />
      )}

      <div className="px-3 py-3 bg-white border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about BloodDrop..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-surface-soft border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-text-light"
            aria-label="Ask about BloodDrop"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            aria-label="Send message"
            className="p-2.5 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-text-light mt-2 text-center">
          BloodDrop Assistant provides platform guidance. Medical decisions should be confirmed with qualified healthcare professionals.
        </p>
      </div>
    </motion.div>
  )
}

export default GeminiChatbot
