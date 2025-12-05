import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBlog, toggleBlogLike, toggleBlogBookmark, getComments, addComment, toggleCommentLike } from '../services/groqAPI';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { 
  Heart, 
  Bookmark, 
  MessageCircle, 
  Share2, 
  ArrowLeft,
  User,
  Send,
  Loader2,
  AlertTriangle,
  ThumbsUp,
  Clock,
  Eye
} from 'lucide-react';

export default function BlogView() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInteraction, setUserInteraction] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    loadBlog();
    loadComments();
  }, [id]);

  const loadBlog = async () => {
    setLoading(true);
    try {
      const response = await getBlog(id);
      setBlog(response.blog);
      setUserInteraction(response.userInteraction);
    } catch (error) {
      toast.error('Blog not found');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await getComments(id);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like');
      return;
    }
    
    try {
      const response = await toggleBlogLike(id);
      setBlog(prev => ({ ...prev, likesCount: response.likesCount }));
      setUserInteraction(prev => ({ ...prev, hasLiked: response.liked }));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark');
      return;
    }
    
    try {
      const response = await toggleBlogBookmark(id);
      setUserInteraction(prev => ({ ...prev, hasBookmarked: response.bookmarked }));
      toast.success(response.bookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
    } catch (error) {
      toast.error('Failed to bookmark');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    setCommentLoading(true);
    try {
      const response = await addComment(id, newComment);
      setComments(prev => [{ ...response.comment, replies: [], hasMoreReplies: false }, ...prev]);
      setBlog(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
      setNewComment('');
      
      if (response.warning) {
        toast.error(response.warning, { icon: '⚠️' });
      } else {
        toast.success('Comment added!');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error('Please login to like');
      return;
    }

    try {
      const response = await toggleCommentLike(id, commentId);
      setComments(prev => prev.map(c => 
        c._id === commentId 
          ? { ...c, likesCount: response.likesCount }
          : c
      ));
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog not found</h2>
        <Link to="/blogs" className="btn-primary">Back to Blogs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link to="/blogs" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blogs
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-64 bg-gradient-to-br from-primary-500 to-purple-600">
          {blog.coverImage ? (
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl font-bold text-white/20">{blog.title?.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Tags */}
          {blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.tags.map((tag, i) => (
                <span key={i} className="badge-primary">{tag}</span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {blog.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {blog.authorPic ? (
                  <img src={blog.authorPic} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{blog.authorName}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {blog.viewsCount} views
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`btn-ghost ${userInteraction?.hasLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`w-5 h-5 mr-1 ${userInteraction?.hasLiked ? 'fill-current' : ''}`} />
                {blog.likesCount || 0}
              </button>
              <button
                onClick={handleBookmark}
                className={`btn-ghost ${userInteraction?.hasBookmarked ? 'text-primary-600' : ''}`}
              >
                <Bookmark className={`w-5 h-5 ${userInteraction?.hasBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleShare} className="btn-ghost">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="prose-custom py-6">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>

          {/* AI Generated Badge */}
          {blog.isAIGenerated && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
              <AlertTriangle className="w-4 h-4" />
              This content was generated with AI assistance
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({blog.commentsCount || 0})
        </h2>

        {/* Add Comment */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="input min-h-[80px] resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">{newComment.length}/2000</span>
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="btn-primary"
                  >
                    {commentLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Login to join the conversation</p>
            <Link to="/login" className="btn-primary text-sm">Login</Link>
          </div>
        )}

        {/* Comments List */}
        {commentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {comment.authorPic ? (
                    <img src={comment.authorPic} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.status === 'flagged' && (
                        <span className="badge-warning text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.comment}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 ml-2">
                    <button
                      onClick={() => handleLikeComment(comment._id)}
                      className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" /> {comment.likesCount || 0}
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                    <div className="mt-3 ml-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                            <span className="font-medium text-gray-900 dark:text-white text-xs">
                              {reply.authorName}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300 text-xs mt-1">
                              {reply.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
