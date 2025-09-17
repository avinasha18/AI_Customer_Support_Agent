import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 p-6"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-tertiary to-primary-hover text-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4" />
      </div>

      {/* Typing Animation */}
      <div className="flex-1">
        <div className="inline-block px-5 py-4 message-ai rounded-2xl shadow-sm">
          <div className="typing-indicator">
            <span className="professional-text text-sm text-secondary mr-3">AI is typing</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="typing-dot"
                  animate={{
                    y: [-2, -6, -2],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;