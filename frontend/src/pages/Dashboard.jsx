import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardData, getLearningRecommendations } from '../services/firebaseDB';
import { 
  FileText, 
  PenTool, 
  TrendingUp, 
  Award, 
  Star, 
  BookOpen,
  Youtube,
  Lightbulb,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboardData();
      setDashboard(data);
      
      // Load recommendations if user has evaluations
      if (data.assignments?.completed > 0) {
        const recs = await getLearningRecommendations();
        setRecommendations(recs.recommendations);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your progress and get personalized insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assignments Evaluated</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboard?.assignments?.completed || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Blogs Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboard?.blogs?.published || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(dashboard?.user?.averageScore || 0).toFixed(1)}/10
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboard?.blogs?.totalLikes || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Card */}
      {userProfile && (
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Level {userProfile.level || 1}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {userProfile.points || 0} points earned
                </p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress to Level {(userProfile.level || 1) + 1}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {(userProfile.points || 0) % 100}/100
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-bg rounded-full transition-all"
                  style={{ width: `${(userProfile.points || 0) % 100}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            {userProfile.badges?.length > 0 && (
              <div className="flex gap-2">
                {userProfile.badges.slice(0, 4).map((badge, i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-xl"
                    title={badge.name}
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Evaluations</h3>
            <Link to="/evaluator" className="text-sm link flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {dashboard?.assignments?.recent?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.assignments.recent.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {item.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`badge ${
                    item.score >= 7 ? 'badge-success' : 
                    item.score >= 5 ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {item.score}/10
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No evaluations yet</p>
              <Link to="/evaluator" className="btn-primary mt-4 inline-block text-sm">
                Start Evaluating
              </Link>
            </div>
          )}
        </div>

        {/* Recent Blogs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Blogs</h3>
            <Link to="/generator" className="text-sm link flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {dashboard?.blogs?.recent?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.blogs.recent.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`badge ${
                    item.status === 'published' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <PenTool className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No blogs yet</p>
              <Link to="/generator" className="btn-primary mt-4 inline-block text-sm">
                Create Blog
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Learning Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Books */}
            {recommendations.recommendedBooks?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Recommended Books
                </h4>
                <div className="space-y-2">
                  {recommendations.recommendedBooks.slice(0, 3).map((book, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{book.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">by {book.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Channels */}
            {recommendations.recommendedChannels?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Youtube className="w-4 h-4" /> Recommended Channels
                </h4>
                <div className="space-y-2">
                  {recommendations.recommendedChannels.slice(0, 3).map((channel, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{channel.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{channel.platform}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {recommendations.toneAdaptationTips?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Writing Tips
                </h4>
                <div className="space-y-2">
                  {recommendations.toneAdaptationTips.slice(0, 3).map((tip, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/evaluator" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Evaluate Assignment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload and analyze your work</p>
            </div>
          </div>
        </Link>

        <Link to="/feedback" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Quick Feedback</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get instant writing help</p>
            </div>
          </div>
        </Link>

        <Link to="/generator" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Generate Blog</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create AI-powered content</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
