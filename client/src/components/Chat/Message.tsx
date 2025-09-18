
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { User, Bot } from "lucide-react"
import type { Message as MessageType } from "../../contexts/ChatContext"
import { useTheme } from "../../contexts/ThemeContext"

interface MessageProps {
  message: MessageType
  index: number
}

const Message = ({ message, index }: MessageProps) => {
  const isUser = message.sender === "user"
  const { theme } = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5,
      }}
      className={`flex gap-4 p-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 400 }}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
          ${
            isUser
              ? `bg-gradient-to-br from-accent-primary to-accent-hover text-white ${theme === "dark" ? "text-white" : "text-black"}`
              : "bg-gradient-to-br from-bg-tertiary to-bg-hover text-secondary border-2 border-border-light"
          }
        `}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </motion.div>

      <div
        className={`
        flex-1 max-w-3xl
        ${isUser ? "text-right" : "text-left"}
      `}
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`
            inline-block px-6 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200
            ${isUser ? `message-user ${theme === "dark" ? "text-white" : "text-black"}` : `message-ai ${theme === "dark" ? "text-white" : "text-black"}`}
          `}
        >
          {isUser ? (
            <p className="professional-text text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-blue professional-text">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 last:mb-0">{children}</ul>,
                  ol: ({ children }) => <ol className="text-sm space-y-1 mb-2 last:mb-0">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className={`bg-bg-tertiary px-2 py-1 rounded-md text-xs font-mono ${theme === "dark" ? "text-white" : "text-black"}`}>{children}</code>
                    ) : (
                      <pre className="bg-bg-tertiary border border-border-light p-4 rounded-xl overflow-x-auto mb-2">
                        <code className={`text-xs font-mono ${theme === "dark" ? "text-white" : "text-black"}`}>{children}</code>
                      </pre>
                    )
                  },
                  strong: ({ children }) => <strong className={`font-semibold text-primary ${theme === "dark" ? "text-white" : "text-black"}`}>{children}</strong>,
                  h1: ({ children }) => <h1 className={`text-lg font-bold mb-2 text-primary ${theme === "dark" ? "text-white" : "text-black"}`}>{children}</h1>,
                  h2: ({ children }) => <h2 className={`text-base font-bold mb-2 text-primary ${theme === "dark" ? "text-white" : "text-black"}`}>{children}</h2>,
                  h3: ({ children }) => <h3 className={`text-sm font-bold mb-1 text-primary ${theme === "dark" ? "text-white" : "text-black"}`}>{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.4 }}
          className="mt-2"
        >
          <span className={`text-xs text-muted professional-text ${theme === "dark" ? "text-white" : "text-black"}`}>
            {message.timestamp.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Message
