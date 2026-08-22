import { MessageCircle } from 'lucide-react'

function ChatbotLauncher({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close BloodDrop Assistant' : 'Ask BloodDrop AI'}
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-brand hover:bg-brand-hover text-white rounded-full shadow-elevated transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97] sm:bottom-6 sm:right-6 ${
        isOpen ? 'ring-2 ring-brand/30' : ''
      }`}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-medium">Ask BloodDrop AI</span>
    </button>
  )
}

export default ChatbotLauncher
