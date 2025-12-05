import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
    index: true
  },
  uid: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    default: 'Anonymous'
  },
  authorPic: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // Toxicity Analysis
  toxicityAnalysis: {
    isToxic: { type: Boolean, default: false },
    isSpam: { type: Boolean, default: false },
    isHateSpeech: { type: Boolean, default: false },
    toxicityScore: { type: Number, default: 0 },
    categories: [String],
    reason: String
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'removed'],
    default: 'approved'
  },
  // Engagement
  likesCount: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String
  }],
  // Reply support
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
commentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
commentSchema.index({ blogId: 1, createdAt: -1 });
commentSchema.index({ uid: 1 });
commentSchema.index({ status: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
