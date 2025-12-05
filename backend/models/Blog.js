import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true
  },
  authorName: {
    type: String,
    default: 'Anonymous'
  },
  authorPic: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  category: {
    type: String,
    default: 'General'
  },
  // SEO
  seoMeta: {
    metaTitle: String,
    metaDescription: String
  },
  // Stats
  readabilityGrade: {
    type: String,
    default: ''
  },
  wordCount: {
    type: Number,
    default: 0
  },
  // Engagement
  likesCount: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String // UIDs of users who liked
  }],
  bookmarksCount: {
    type: Number,
    default: 0
  },
  bookmarkedBy: [{
    type: String // UIDs of users who bookmarked
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  // Generation info
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  generationParams: {
    topic: String,
    keywords: [String],
    audience: String,
    tone: String,
    requestedLength: Number
  },
  // AI Review
  aiReview: {
    rating: String,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String]
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
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
blogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  // Generate excerpt from content
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.replace(/[#*`]/g, '').substring(0, 200) + '...';
  }
  next();
});

// Indexes for efficient queries
blogSchema.index({ uid: 1, createdAt: -1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ category: 1 });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
