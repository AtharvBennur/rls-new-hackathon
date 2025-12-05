import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // If assistant provided structured feedback
  structuredFeedback: {
    rating: String,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    improvedVersion: String
  }
});

const chatHistorySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp and title on save
chatHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Auto-generate title from first user message
  if (this.title === 'New Chat' && this.messages.length > 0) {
    const firstUserMsg = this.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      this.title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    }
  }
  next();
});

// Index for efficient queries
chatHistorySchema.index({ uid: 1, updatedAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
