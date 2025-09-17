import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  X,
  Lock
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

interface SidebarProps {
  onDeleteClick: (conversationId: string, conversationTitle: string) => void;
}

const Sidebar = ({ onDeleteClick }: SidebarProps) => {
  const { 
    conversations, 
    activeConversationId, 
    createConversation, 
    selectConversation, 
    renameConversation,
    selectedModel,
    setSelectedModel,
    availableModels
  } = useChat();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleNewChat = async () => {
    try {
      await createConversation();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleEditStart = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleEditSave = () => {
    if (editingId && editingTitle.trim()) {
      if (editingTitle.trim().length > 200) {
        showError('Invalid Title', 'Title cannot exceed 200 characters');
        return;
      }
      renameConversation(editingId, editingTitle.trim());
      showSuccess('Conversation Renamed', `Renamed to "${editingTitle.trim()}"`);
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };


  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-80 sidebar-professional flex flex-col h-full transition-all duration-300"
    >
      {/* Header */}
      <div className="p-6 border-b border-light">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 bg-white rounded-md"></div>
          </div>
          <h1 className="professional-heading text-xl text-primary">AI Support Chat</h1>
        </div>

        <motion.button
          onClick={handleNewChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full flex items-center gap-3 font-medium"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </motion.button>
      </div>

      {/* AI Model Selector */}
      <div className="p-6 border-b border-light">
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 btn-secondary hover-lift"
          >
            <span className="professional-text text-sm font-medium text-primary">
              {availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showModelDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="dropdown-professional absolute top-full left-0 right-0 mt-2 z-10"
              >
                {availableModels.map((model) => {
                  const isFree = model.id.includes(':free');
                  const isSelected = model.id === selectedModel;
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (isFree) {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                        }
                      }}
                      disabled={!isFree}
                      className={`
                        w-full text-left px-4 py-3 text-sm transition-all duration-200 
                        first:rounded-t-lg last:rounded-b-lg relative professional-text
                        ${isFree 
                          ? 'hover:bg-hover cursor-pointer hover-lift' 
                          : 'cursor-not-allowed opacity-60'
                        }
                        ${isSelected ? 'bg-accent-light text-accent-primary' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className={`
                            ${isSelected ? 'text-accent-primary font-medium' : 'text-primary'}
                            ${!isFree ? 'line-through' : ''}
                          `}>
                            {model.name}
                          </span>
                          <span className="text-xs text-tertiary">
                            {model.provider}
                          </span>
                        </div>
                        {!isFree && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      {!isFree && (
                        <div className="absolute inset-0 bg-secondary opacity-50 rounded" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-3">
          <AnimatePresence>
            {conversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer card hover-lift
                  transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
                  ${activeConversationId === conversation.id ? 'bg-accent-light border-l-4 border-accent-primary shadow-md' : ''}
                `}
                onClick={() => selectConversation(conversation.id)}
              >
                <MessageSquare className="w-4 h-4 text-tertiary flex-shrink-0" />
                
                {editingId === conversation.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm input-professional professional-text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave();
                        } else if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleEditSave}
                      className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 professional-text text-sm text-primary truncate font-medium">
                      {conversation.title}
                    </span>
                    
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStart(conversation.id, conversation.title);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(conversation.id, conversation.title);
                        }}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-light">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center shadow-sm">
            <span className="professional-text text-sm font-semibold text-accent-primary">
              {user?.firstName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="professional-text text-sm font-semibold text-primary">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="professional-text text-xs text-tertiary">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-secondary hover:bg-hover rounded-xl transition-all duration-200 font-medium hover-lift"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </motion.button>

          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 font-medium hover-lift"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </div>

    </motion.div>
  );
};

export default Sidebar;