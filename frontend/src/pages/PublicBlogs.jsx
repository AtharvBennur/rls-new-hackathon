import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogFeed } from '../services/groqAPI';
import { 
  Search, 
  Filter, 
  Heart, 
  MessageCircle, 
  Eye, 
  Bookmark,
  Clock,
  TrendingUp,
  Loader2,
  User
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest', icon: Clock },
  { value: 'popular', label: 'Popular', icon: Heart },
  { value: 'trending', label: 'Trending', icon: TrendingUp },
];

const CATEGORIES = [
  'All', 'Technology', 'Education', 'Business', 'Science', 
  'Health', 'Arts', 'Sports', 'General'
];

export default function PublicBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('latest');
  const [category, setCategory] = useState('All');
  const [searchTag, setSearchTag] = useState('');

  useEffect(() => {
    loadBlogs(true);
  }, [sort, category]);

  const loadBlogs = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 12,
        sort,
        ...(category !== 'All' && { category }),
        ...(searchTag && { tag: searchTag })
      };

      const response = await getBlogFeed(params);
      
      if (reset) {
        setBlogs(response.blogs || []);
        setPage(1);
      } else {
        setBlogs(prev => [...prev, ...(response.blogs || [])]);
      }
      
      setHasMore(response.blogs?.length === 12);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadBlogs(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadBlogs(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Public Blog Feed</h1>
        <p className="text-gray-600 dark:text-gray-400">Discover and read blogs from our community</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Search by tag..."
                className="input pl-10"
              />
            </div>
          </form>

          {/* Sort */}
          <div className="flex gap-2">
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setSort(option.value)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  sort === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      {loading && blogs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : blogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link 
                key={blog._id} 
                to={`/blogs/${blog._id}`}
                className="card overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-br from-primary-500 to-purple-600 relative">
                  {blog.coverImage ? (
                    <img 
                      src={blog.coverImage} 
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl font-bold text-white/20">
                        {blog.title?.charAt(0) || 'B'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Author */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {blog.authorPic ? (
                        <img src={blog.authorPic} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{blog.authorName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {blog.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {blog.excerpt}
                  </p>

                  {/* Tags */}
                  {blog.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {blog.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="badge-primary text-xs">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> {blog.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" /> {blog.commentsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {blog.viewsCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button 
                onClick={loadMore}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No blogs found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTag || category !== 'All' 
              ? 'Try adjusting your filters' 
              : 'Be the first to publish a blog!'}
          </p>
          <Link to="/generator" className="btn-primary mt-4 inline-block">
            Create Blog
          </Link>
        </div>
      )}
    </div>
  );
}
