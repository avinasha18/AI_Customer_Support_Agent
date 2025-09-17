import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const MessageList = () => {
  const { activeConversation, isTyping } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [activeConversation?.messages, isTyping]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl"></div>
          </div>
          <h3 className="professional-heading text-2xl text-primary mb-4">
            Welcome to AI Support Chat
          </h3>
          <p className="professional-text text-tertiary leading-relaxed">
            Start a new conversation or select an existing one from the sidebar to begin chatting with our AI assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        {activeConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <h3 className="professional-heading text-xl text-primary mb-3">
                Start your conversation
              </h3>
              <p className="professional-text text-tertiary leading-relaxed">
                Ask me anything! I'm here to help with your questions.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <AnimatePresence>
              {activeConversation.messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  index={index}
                />
              ))}
              
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
};

export default MessageList;