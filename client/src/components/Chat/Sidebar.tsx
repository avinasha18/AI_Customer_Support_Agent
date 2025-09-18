"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Lock,
  Sparkles,
} from "lucide-react"
import { useChat } from "../../contexts/ChatContext"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useToast } from "../../contexts/ToastContext"

interface SidebarProps {
  onDeleteClick: (conversationId: string, conversationTitle: string) => void
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
    availableModels,
  } = useChat()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { showSuccess, showError } = useToast()

  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const handleNewChat = async () => {
    try {
      await createConversation()
    } catch (error) {
      console.error("Failed to create conversation:", error)
    }
  }

  const handleEditStart = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const handleEditSave = () => {
    if (editingId && editingTitle.trim()) {
      if (editingTitle.trim().length > 200) {
        showError("Invalid Title", "Title cannot exceed 200 characters")
        return
      }
      renameConversation(editingId, editingTitle.trim())
      showSuccess("Conversation Renamed", `Renamed to "${editingTitle.trim()}"`)
    }
    setEditingId(null)
    setEditingTitle("")
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.6 }}
      className="w-80 sidebar-professional flex flex-col h-full transition-all duration-300"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="p-6 border-b border-light"
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-hover rounded-xl flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="professional-heading text-xl text-primary">AI Support Chat</h1>
        </div>

        <motion.button
          onClick={handleNewChat}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full flex items-center gap-3 font-medium ripple"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="p-6 border-b border-light"
      >
        <div className="relative">
          <motion.button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 btn-secondary hover-lift"
          >
            <span className="professional-text text-sm font-medium text-primary">
              {availableModels.find((m) => m.id === selectedModel)?.name || selectedModel}
            </span>
            <motion.div animate={{ rotate: showModelDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-muted" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showModelDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="dropdown-professional absolute top-full left-0 right-0 mt-2 z-10"
              >
                {availableModels.map((model, index) => {
                  const isFree = model.id.includes(":free")
                  const isSelected = model.id === selectedModel

                  return (
                    <motion.button
                      key={model.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (isFree) {
                          setSelectedModel(model.id)
                          setShowModelDropdown(false)
                        }
                      }}
                      disabled={!isFree}
                      className={`
                        w-full text-left px-4 py-3 text-sm transition-all duration-200 
                        first:rounded-t-xl last:rounded-b-xl relative professional-text
                        ${isFree ? "hover:bg-hover cursor-pointer hover-lift" : "cursor-not-allowed opacity-60"}
                        ${isSelected ? "bg-accent-light text-accent-primary" : ""}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span
                            className={`
                            ${isSelected ? "text-accent-primary font-medium" : "text-primary"}
                            ${!isFree ? "line-through" : ""}
                          `}
                          >
                            {model.name}
                          </span>
                          <span className="text-xs text-tertiary">{model.provider}</span>
                        </div>
                        {!isFree && <Lock className="w-4 h-4 text-muted" />}
                      </div>
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-3">
          <AnimatePresence>
            {conversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                className={`
                  group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer card hover-lift
                  transition-all duration-200
                  ${
                    activeConversationId === conversation.id
                      ? "bg-accent-light border-l-4 border-accent-primary shadow-lg scale-105"
                      : "hover:bg-hover"
                  }
                `}
                onClick={() => selectConversation(conversation.id)}
              >
                <motion.div whileHover={{ scale: 1.1 }} className="flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-tertiary" />
                </motion.div>

                {editingId === conversation.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm input-professional professional-text rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEditSave()
                        } else if (e.key === "Escape") {
                          handleEditCancel()
                        }
                      }}
                      autoFocus
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEditSave}
                      className="p-2 text-success text-amber-200 hover:bg-success-light rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEditCancel}
                      className="p-2 text-error hover:bg-error-light rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 professional-text text-sm text-primary truncate font-medium">
                      {conversation.title}
                    </span>

                    <div className="hidden group-hover:flex items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditStart(conversation.id, conversation.title)
                        }}
                        className="p-2 text-muted hover:text-accent-primary hover:bg-accent-light rounded-lg transition-all"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteClick(conversation.id, conversation.title)
                        }}
                        className="p-2 text-muted hover:text-error hover:bg-error-light rounded-lg transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="p-6 border-t border-light"
      >
        <div className="flex items-center gap-3 mb-6">
           <motion.div
             whileHover={{ scale: 1.05 }}
             className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-2 border-blue-300 dark:border-blue-500 rounded-xl flex items-center justify-center shadow-lg"
           >
             <span className="text-lg font-bold text-white">
               {user?.firstName?.charAt(0).toUpperCase()}
             </span>
           </motion.div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-secondary hover:bg-hover rounded-xl transition-all duration-200 font-medium hover-lift"
          >
            <motion.div animate={{ rotate: theme === "light" ? 0 : 180 }} transition={{ duration: 0.3 }}>
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.div>
            {theme === "light" ? "Dark" : "Light"}
          </motion.button>

          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-error-light rounded-xl transition-all duration-200 font-medium hover-lift ${theme === "light" ? "text-error" : "text-white"}`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Sidebar
