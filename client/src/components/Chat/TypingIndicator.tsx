"use client"

import { motion } from "framer-motion"
import { Bot } from "lucide-react"

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
      className="flex gap-4 p-6"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            "0 10px 15px -3px rgba(59, 130, 246, 0.3)",
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-bg-tertiary to-bg-hover text-secondary flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-border-light"
      >
        <Bot className="w-5 h-5" />
      </motion.div>

      <div className="flex-1">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-block px-6 py-4 message-ai rounded-2xl shadow-md"
        >
          <div className="typing-indicator">
            <span className="professional-text text-sm text-secondary mr-4">AI is thinking</span>
            <div className="flex space-x-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="typing-dot"
                  animate={{
                    y: [-3, -8, -3],
                    opacity: [0.4, 1, 0.4],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default TypingIndicator
