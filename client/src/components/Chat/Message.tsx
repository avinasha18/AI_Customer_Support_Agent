import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import type { Message as MessageType } from '../../contexts/ChatContext';

interface MessageProps {
  message: MessageType;
  index: number;
}

const Message = ({ message, index }: MessageProps) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex gap-4 p-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
        ${isUser 
          ? 'bg-gradient-to-br from-accent-primary to-accent-hover text-white' 
          : 'bg-gradient-to-br from-primary-tertiary to-primary-hover text-secondary'
        }
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`
        flex-1 max-w-3xl
        ${isUser ? 'text-right' : 'text-left'}
      `}>
        <div className={`
          inline-block px-5 py-4 rounded-2xl shadow-sm
          ${isUser 
            ? 'message-user' 
            : 'message-ai'
          }
        `}>
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
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">{children}</code>
                    ) : (
                      <pre className="bg-gray-800 dark:bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto mb-2">
                        <code className="text-xs">{children}</code>
                      </pre>
                    );
                  },
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className="mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {message.timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Message;