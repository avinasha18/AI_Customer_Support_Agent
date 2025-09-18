"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Sparkles } from "lucide-react"
import { useChat } from "../../contexts/ChatContext"

const MessageInput = () => {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const { sendMessage, isTyping, activeConversation } = useChat()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isTyping || !activeConversation) return

    const messageToSend = message.trim()
    setMessage("")
    await sendMessage(messageToSend)
  }

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="sticky bottom-0 bg-primary/95 backdrop-blur-md border-t border-light p-6"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-4">
          <div className="flex-1 relative">
            <motion.div
              animate={{
                scale: isFocused ? 1.02 : 1,
                boxShadow: isFocused
                  ? "0 0 0 4px var(--accent-light), 0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                  : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={activeConversation ? "Type your message..." : "Start a new conversation to begin"}
                disabled={!activeConversation || isTyping}
                rows={1}
                className="w-full px-6 py-4 pr-16 input-professional rounded-2xl professional-text
                         focus:ring-0 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed
                         resize-none transition-all duration-200
                         max-h-32 overflow-y-auto custom-scrollbar
                         border-2 border-light"
                style={{
                  minHeight: "56px",
                  height: "auto",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />

              <motion.button
                type="submit"
                disabled={!message.trim() || isTyping || !activeConversation}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 bottom-3 w-12 h-12 btn-primary disabled:bg-tertiary
                         text-white rounded-xl flex items-center justify-center
                         transition-all duration-200 disabled:cursor-not-allowed ripple
                         shadow-lg hover:shadow-xl"
              >
                <AnimatePresence mode="wait">
                  {isTyping ? (
                    <motion.div
                      key="loading"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      exit={{ rotate: 0 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <AnimatePresence>
                {message.trim() && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute right-16 bottom-4 text-accent-primary"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-3"
        >
          <p className="text-xs text-muted text-center professional-text">
            Press Enter to send, Shift + Enter for new line
          </p>
        </motion.div>
      </form>
    </motion.div>
  )
}

export default MessageInput
