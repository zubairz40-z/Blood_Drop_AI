import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import ChatbotLauncher from './components/chatbot/ChatbotLauncher'
import GeminiChatbot from './components/chatbot/GeminiChatbot'
import { AuthProvider } from './context/AuthContext'

const hideChatbotPaths = ['/login', '/register', '/forgot-password', '/design-system']

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()
  const hideChatbot = hideChatbotPaths.some((p) => location.pathname.startsWith(p))

    return (
    <AuthProvider>
      <AppRoutes />
      {!hideChatbot && (
        <>
          <ChatbotLauncher
            onClick={() => setChatOpen((prev) => !prev)}
            isOpen={chatOpen}
          />
          {chatOpen && <GeminiChatbot onClose={() => setChatOpen(false)} />}
        </>
      )}
    </AuthProvider>
  )
}

export default App
