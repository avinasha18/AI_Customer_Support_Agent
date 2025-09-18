"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Sparkles, MessageSquare, Zap, Shield, Users, ArrowRight, Lightbulb, ArrowUpLeft } from "lucide-react"
import { useChat } from "../../contexts/ChatContext"
import Message from "./Message"
import TypingIndicator from "./TypingIndicator"
import { useTheme } from "../../contexts/ThemeContext"

const MessageList = () => {
  const { activeConversation, isTyping, conversations } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
      })
    }
  }, [activeConversation?.messages, isTyping])

  if (!activeConversation) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-5xl font-bold   mb-6 ${theme === "light" ? "text-gray-900" : "text-white"} professional-heading`}
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Support Chat
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className={`text-xl text-gray-800 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-8 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              Your intelligent AI assistant is ready to help you with questions, provide insights, 
              and assist with various tasks.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 max-w-2xl mx-auto mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💡</span>
                </div>
                <p className={`text-blue-800 dark:text-blue-200 font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>
                  <strong>Tip:</strong> Click the "New Chat" button in the sidebar to start your first conversation!
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 flex items-center gap-3 opacity-90"
              >
                <MessageSquare className="w-5 h-5" />
                Click on New Chat to start a new conversation
                <ArrowUpLeft className="w-5 h-5" />
              </motion.div>
              
              {conversations.length > 0 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 flex items-center gap-3 opacity-90"
                >
                  <Users className="w-5 h-5" />
                  View Chat History
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-6 text-center"
            >
              <p className={`text-sm text-gray-500 dark:text-gray-400 italic ${theme === "dark" ? "text-white" : "text-black"}`}>
                👈 Use the sidebar to start a new chat or select an existing conversation
              </p>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get instant responses with our optimized AI models for quick and accurate answers."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your conversations are encrypted and secure. We prioritize your privacy and data protection."
              },
              {
                icon: Users,
                title: "Always Available",
                description: "24/7 AI assistance ready to help with any questions or tasks you might have."
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>
                  {feature.title}
                </h3>
                <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${theme === "dark" ? "text-white" : "text-black"}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-blue-100 dark:border-gray-600"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
          </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pro Tips
          </h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                    1
                  </div>
                  <p className={`text-gray-800 dark:text-gray-300 ${theme === "dark" ? "text-white" : "text-black"}`}>
                    <strong>Be specific:</strong> Ask detailed questions for more accurate and helpful responses.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                    2
                  </div>
                  <p className={`text-gray-800 dark:text-gray-300 ${theme === "dark" ? "text-white" : "text-black"}`}>
                    <strong>Use context:</strong> Reference previous messages to maintain conversation flow.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                    3
                  </div>
                  <p className={`text-gray-800 dark:text-gray-300 ${theme === "dark" ? "text-white" : "text-black"}`}>
                    <strong>Explore topics:</strong> Try different types of questions to discover AI capabilities.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                    4
                  </div>
                  <p className={`text-gray-800 dark:text-gray-300 ${theme === "dark" ? "text-white" : "text-black"}`}>
                    <strong>Use the sidebar:</strong> Click "New Chat" in the sidebar to start conversations or select existing ones.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        {activeConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-lg"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <MessageSquare className="w-10 h-10 text-white" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Ready to Chat!
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg mb-6"
              >
                Ask me anything! I'm here to help with your questions, provide insights, and assist with various tasks.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                AI Assistant Online
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-2 p-6">
            <AnimatePresence>
              {activeConversation.messages.map((message, index) => (
                <Message key={message.id} message={message} index={index} />
              ))}
              
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  )
}

export default MessageList
