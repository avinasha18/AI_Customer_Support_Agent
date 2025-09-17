import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, isTyping, activeConversation } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isTyping || !activeConversation) return;

    const messageToSend = message.trim();
    setMessage('');
    await sendMessage(messageToSend);
  };

  return (
    <div className="sticky bottom-0 bg-primary border-t border-light p-6">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={activeConversation ? "Type your message..." : "Start a new conversation to begin"}
              disabled={!activeConversation || isTyping}
              rows={1}
              className="w-full px-5 py-4 pr-14 input-professional rounded-2xl professional-text
                       focus:ring-2 focus:ring-accent-primary focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed
                       resize-none transition-all duration-200
                       max-h-32 overflow-y-auto custom-scrollbar"
              style={{
                minHeight: '52px',
                height: 'auto'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            <motion.button
              type="submit"
              disabled={!message.trim() || isTyping || !activeConversation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-3 bottom-3 w-10 h-10 btn-primary disabled:bg-tertiary
                       text-white rounded-xl flex items-center justify-center
                       transition-all duration-200 disabled:cursor-not-allowed hover-lift"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>
        
        <div className="flex justify-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;