import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiService, type Model } from '../services/api';
import { generateMessageId } from '../utils/idGenerator';
import { useToast } from './ToastContext';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
}

export interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  isTyping: boolean;
  selectedModel: string;
  availableModels: Model[];
  createConversation: () => Promise<string>;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.3-70b-instruct:free');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const { showError } = useToast();

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Load available models on mount
  useEffect(() => {
  const loadModels = async () => {
    try {
      const models = await apiService.getModels();
     
      
      if (!models) {
        console.error('Models response is null/undefined');
        return;
      }
      
      if (!Array.isArray(models)) {
        console.error('Models response is not an array:', models);
        return;
      }
      
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
    }
  };

    loadModels();
  }, []);

  // Create conversation function (moved up to avoid hoisting issues)
  const createConversation = useCallback(async (): Promise<string> => {
    try {
      // Create conversation in database immediately
      const response = await apiService.createConversation();
      
      const newConversation: Conversation = {
        id: response.id,
        title: response.title,
        messages: response.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.createdAt),
        })),
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
        model: response.model,
      };

      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-select conversation logic after conversations are loaded
  useEffect(() => {
    const handleAutoConversationSelection = () => {
      // Only run if we have conversations loaded and no active conversation
      if (conversations.length > 0 && !activeConversationId) {
        // Sort by updatedAt to get the most recent conversation
        const sortedConversations = [...conversations].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        const mostRecentConversation = sortedConversations[0];
        console.log('Auto-selecting most recent conversation:', mostRecentConversation.id);
        setActiveConversationId(mostRecentConversation.id);
      }
      // If no conversations exist, just show the welcome page - no auto-creation
    };

    handleAutoConversationSelection();
  }, [conversations, activeConversationId]);

  const loadConversations = async (): Promise<void> => {
    try {
      const response = await apiService.getConversationHistory();
      
      // Check if response and data exist
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format from getConversationHistory:', response);
        setConversations([]);
        return;
      }
      
      const convertedConversations: Conversation[] = response.data.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.createdAt),
        })),
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        model: conv.model,
      }));
      console.log('Setting conversations:', convertedConversations.length, 'conversations');
      setConversations(convertedConversations);
      
      // Note: Auto-selection logic moved to separate useEffect for better control
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    }
  };

  const loadConversation = async (id: string): Promise<void> => {
    try {
      const conv = await apiService.getConversation(id);
      const convertedConversation: Conversation = {
        id: conv.id,
        title: conv.title,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.createdAt),
        })),
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        model: conv.model,
      };
      
      setConversations(prev => {
        const existing = prev.find(c => c.id === id);
        if (existing) {
          return prev.map(c => c.id === id ? convertedConversation : c);
        } else {
          return [convertedConversation, ...prev];
        }
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const sendMessage = async (content: string) => {
    if (!activeConversationId) return;

    const userMessage: Message = {
      id: generateMessageId(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId
        ? {
            ...conv,
            messages: [...conv.messages, userMessage],
            title: conv.messages.length === 0 ? content.slice(0, 50) : conv.title,
            updatedAt: new Date()
          }
        : conv
    ));

    // Show typing indicator
    setIsTyping(true);

    let aiMessageId = generateMessageId();
    let aiContent = '';
    let streamingStarted = false;

    try {
      console.log('Sending message with:', {
        activeConversationId,
        message: content,
        model: selectedModel
      });
      
      await apiService.sendMessageStream(
        {
          message: content,
          conversationId: activeConversationId,
          model: selectedModel,
          stream: true
        },
        (chunk: string) => {
          if (!streamingStarted) {
            // First chunk - hide typing indicator and add AI message
            setIsTyping(false);
            streamingStarted = true;
            setConversations(prev => prev.map(conv => 
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, {
                      id: aiMessageId,
                      content: chunk,
                      sender: 'ai' as const,
                      timestamp: new Date(),
                      isTyping: false
                    }],
                    updatedAt: new Date()
                  }
                : conv
            ));
            aiContent = chunk;
          } else {
            // Subsequent chunks - update the AI message
            aiContent += chunk;
            setConversations(prev => prev.map(conv => 
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: conv.messages.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: aiContent }
                        : msg
                    ),
                    updatedAt: new Date()
                  }
                : conv
            ));
          }
        },
        (conversationId: string) => {
          // This callback is called in two cases:
          // 1. When conversation is created (conversationId is provided) - don't reset isTyping
          // 2. When streaming ends (conversationId is empty) - reset isTyping
          if (conversationId === '') {
            // Streaming ended with [DONE] - hide typing indicator
            console.log('Streaming completed');
            setIsTyping(false);
          } else {
            // Conversation created - keep typing indicator
            console.log('Conversation created:', conversationId);
          }
        },
        (error: string) => {
          console.error('Streaming error:', error, {
            activeConversationId,
            message: content,
            aiMessageId
          });
          
          // Hide typing indicator
          setIsTyping(false);
          
          // Add error message if streaming hasn't started yet
          if (!streamingStarted) {
            setConversations(prev => prev.map(conv => 
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, {
                      id: aiMessageId,
                      content: `Error: ${error}`,
                      sender: 'ai' as const,
                      timestamp: new Date(),
                      isTyping: false
                    }],
                    updatedAt: new Date()
                  }
                : conv
            ));
          } else {
            // Update existing AI message with error
            setConversations(prev => prev.map(conv => 
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: conv.messages.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: `${aiContent}\n\nError: ${error}` }
                        : msg
                    ),
                    updatedAt: new Date()
                  }
                : conv
            ));
          }
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error, {
        activeConversationId,
        message: content,
        aiMessageId,
        selectedModel
      });
      // Update the AI message with error
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === aiMessageId
                  ? { ...msg, content: 'Failed to send message. Please try again.', isTyping: false }
                  : msg
              ),
              updatedAt: new Date()
            }
          : conv
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const deleteConversation = async (id: string): Promise<void> => {
    try {
      await apiService.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      console.log('Conversation deleted successfully:', id);
    } catch (error) {
      console.error('Failed to delete conversation:', error, {
        conversationId: id,
        activeConversationId
      });
      showError('Delete Failed', 'Failed to delete conversation. Please try again.');
    }
  };

  const renameConversation = async (id: string, title: string): Promise<void> => {
    try {
      const updatedConv = await apiService.renameConversation(id, title);
      setConversations(prev => prev.map(conv => 
        conv.id === id ? { ...conv, title: updatedConv.title } : conv
      ));
      console.log('Conversation renamed successfully:', id, 'to:', title);
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      showError('Rename Failed', 'Failed to rename conversation. Please try again.');
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      activeConversation,
      isTyping,
      selectedModel,
      availableModels,
      createConversation,
      selectConversation,
      sendMessage,
      deleteConversation,
      renameConversation,
      setSelectedModel,
      loadConversations,
      loadConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
};
