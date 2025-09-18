"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Sidebar from "./Sidebar"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import ConfirmationModal from "../UI/ConfirmationModal"
import { useChat } from "../../contexts/ChatContext"
import { useToast } from "../../contexts/ToastContext"

const ChatInterface = () => {
  const { selectedModel, deleteConversation, activeConversation } = useChat()
  const { showSuccess, showError } = useToast()

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    conversationId: string
    conversationTitle: string
  }>({
    isOpen: false,
    conversationId: "",
    conversationTitle: "",
  })

  const handleDeleteClick = (conversationId: string, conversationTitle: string) => {
    setDeleteModal({
      isOpen: true,
      conversationId,
      conversationTitle,
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteConversation(deleteModal.conversationId)
      showSuccess("Conversation Deleted", `"${deleteModal.conversationTitle}" has been deleted`)
    } catch (error) {
      showError("Delete Failed", "Failed to delete conversation. Please try again.")
    }
    setDeleteModal({ isOpen: false, conversationId: "", conversationTitle: "" })
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, conversationId: "", conversationTitle: "" })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex h-screen bg-secondary transition-all duration-300"
    >
      {/* Sidebar */}
      <Sidebar onDeleteClick={handleDeleteClick} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-primary border-b border-light px-8 py-6 transition-all duration-300 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="professional-heading text-xl text-primary">AI Support Assistant</h1>
              <p className="professional-text text-sm text-tertiary mt-1">Powered by {selectedModel}</p>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="flex items-center gap-2 px-4 py-2 bg-success-light text-success rounded-xl text-xs font-medium shadow-sm"
              >
                <div className="w-2 h-2 bg-success rounded-full pulse"></div>
                Online
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MessageList />
        </div>

        {/* Input - Only show when there's an active conversation */}
        {activeConversation && <MessageInput />}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteModal.conversationTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
      />
    </motion.div>
  )
}

export default ChatInterface
