import { Bot, User } from 'lucide-react'

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-brand-soft flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-brand" />
        </div>
      )}

      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand text-white rounded-br-md'
            : 'bg-white border border-border text-text-dark rounded-bl-md'
        }`}
      >
        {message.text}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
      )}
    </div>
  )
}

export default ChatMessage
