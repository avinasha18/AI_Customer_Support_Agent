import { Schema, model } from 'mongoose';
import { IConversation, IMessage, IConversationModel } from '@/types';
import { generateConversationId, generateMessageId } from '@/utils/idGenerator';

const messageSchema = new Schema<IMessage>(
  {
    id: {
      type: String,
      required: [true, 'Message ID is required'],
      // Removed unique: true to prevent E11000 duplicate key errors
      // Message IDs are unique by design (timestamp + random)
    },
    role: {
      type: String,
      required: [true, 'Message role is required'],
      enum: ['user', 'assistant', 'system'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [10000, 'Message content cannot exceed 10,000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // Don't create separate _id for messages
  }
);

const conversationSchema = new Schema<IConversation>(
  {
    customId: {
      type: String,
      required: [true, 'Custom ID is required'],
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'New Conversation',
    },
    messages: {
      type: [messageSchema],
      default: [],
      validate: {
        validator: function (messages: IMessage[]) {
          return messages.length <= 100; // Limit to 100 messages per conversation
        },
        message: 'Conversation cannot have more than 100 messages',
      },
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      default: 'meta-llama/llama-3.3-70b-instruct:free',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
conversationSchema.index({ userId: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ 'messages.createdAt': -1 });

// Pre-save middleware to update title from first message if not set
conversationSchema.pre('save', function (next) {
  if (this.isNew && this.messages.length > 0 && this.title === 'New Conversation') {
    const firstUserMessage = this.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      // Create title from first 50 characters of first user message
      this.title = firstUserMessage.content.substring(0, 50).trim();
      if (this.title.length < firstUserMessage.content.length) {
        this.title += '...';
      }
    }
  }
  next();
});

// Instance method to add message
conversationSchema.methods.addMessage = function (role: 'user' | 'assistant' | 'system', content: string): void {
  this.messages.push({
    id: generateMessageId(),
    role,
    content,
    createdAt: new Date(),
  });
  
  // Update the conversation's updatedAt timestamp
  this.updatedAt = new Date();
};

// Instance method to get last message
conversationSchema.methods.getLastMessage = function (): IMessage | null {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
};

// Instance method to get message count
conversationSchema.methods.getMessageCount = function (): number {
  return this.messages.length;
};

// Instance method to clear messages
conversationSchema.methods.clearMessages = function (): void {
  this.messages = [];
  this.updatedAt = new Date();
};

// Static method to create conversation
conversationSchema.statics.createConversation = function (userId: string, title?: string, model?: string) {
  return new this({
    customId: generateConversationId(),
    userId,
    title: title || 'New Conversation',
    model: model || 'meta-llama/llama-3.3-70b-instruct:free',
    messages: [],
  });
};

// Static method to find conversations by user with pagination
conversationSchema.statics.findByUser = function (userId: string, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'firstName lastName email');
};

// Static method to count conversations by user
conversationSchema.statics.countByUser = function (userId: string) {
  return this.countDocuments({ userId });
};

// Static method to find conversation by ID and user (for ownership verification)
conversationSchema.statics.findByIdAndUser = function (conversationId: string, userId: string) {
  return this.findOne({ _id: conversationId, userId });
};

// Static method to find conversation by custom ID and user
conversationSchema.statics.findByCustomIdAndUser = function (customId: string, userId: string) {
  return this.findOne({ customId, userId });
};

export const Conversation = model<IConversation, IConversationModel>('Conversation', conversationSchema);
