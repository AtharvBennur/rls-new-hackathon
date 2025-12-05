import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePic: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  // Gamification
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    icon: String
  }],
  // Stats
  totalAssignmentsEvaluated: {
    type: Number,
    default: 0
  },
  totalBlogsPublished: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  // Preferences
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  emailNotifications: {
    type: Boolean,
    default: true
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
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate level based on points
userSchema.methods.calculateLevel = function() {
  const pointsPerLevel = 100;
  this.level = Math.floor(this.points / pointsPerLevel) + 1;
  return this.level;
};

// Add points and check for badges
userSchema.methods.addPoints = function(points, reason) {
  this.points += points;
  this.calculateLevel();
  
  // Check for badges
  const badges = [];
  
  if (this.totalAssignmentsEvaluated >= 1 && !this.badges.find(b => b.name === 'First Evaluation')) {
    badges.push({ name: 'First Evaluation', description: 'Completed your first assignment evaluation', icon: '🎯' });
  }
  if (this.totalAssignmentsEvaluated >= 10 && !this.badges.find(b => b.name === 'Dedicated Learner')) {
    badges.push({ name: 'Dedicated Learner', description: 'Evaluated 10 assignments', icon: '📚' });
  }
  if (this.totalAssignmentsEvaluated >= 50 && !this.badges.find(b => b.name === 'Writing Master')) {
    badges.push({ name: 'Writing Master', description: 'Evaluated 50 assignments', icon: '✨' });
  }
  if (this.averageScore >= 8 && this.totalAssignmentsEvaluated >= 5 && !this.badges.find(b => b.name === 'Excellence')) {
    badges.push({ name: 'Excellence', description: 'Maintained average score of 8+', icon: '🏆' });
  }
  if (this.totalBlogsPublished >= 1 && !this.badges.find(b => b.name === 'First Blog')) {
    badges.push({ name: 'First Blog', description: 'Published your first blog', icon: '✍️' });
  }
  if (this.totalBlogsPublished >= 10 && !this.badges.find(b => b.name === 'Prolific Writer')) {
    badges.push({ name: 'Prolific Writer', description: 'Published 10 blogs', icon: '📝' });
  }
  
  this.badges.push(...badges);
  return badges;
};

const User = mongoose.model('User', userSchema);

export default User;
