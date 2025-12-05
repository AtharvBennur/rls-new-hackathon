import api from './api';

// Evaluate assignment (upload PDF)
export const evaluateAssignment = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/evaluate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
};

// Evaluate text directly
export const evaluateText = async (text, title = 'Text Evaluation') => {
  const response = await api.post('/evaluate/text', { text, title });
  return response.data;
};

// Get quick feedback on text
export const getQuickFeedback = async (text) => {
  const response = await api.post('/feedback', { text });
  return response.data;
};

// Chat-based feedback
export const sendChatMessage = async (message, sessionId = null) => {
  const response = await api.post('/feedback/chat', { message, sessionId });
  return response.data;
};

// Get chat history list
export const getChatHistory = async (page = 1, limit = 10) => {
  const response = await api.get(`/feedback/history?page=${page}&limit=${limit}`);
  return response.data;
};

// Get specific chat session
export const getChatSession = async (sessionId) => {
  const response = await api.get(`/feedback/session/${sessionId}`);
  return response.data;
};

// Delete chat session
export const deleteChatSession = async (sessionId) => {
  const response = await api.delete(`/feedback/session/${sessionId}`);
  return response.data;
};

// Export chat
export const exportChat = async (sessionId, format = 'text') => {
  const response = await api.get(`/feedback/export/${sessionId}?format=${format}`);
  return response.data;
};

// Generate blog
export const generateBlog = async (params) => {
  const response = await api.post('/blog/generate', params);
  return response.data;
};

// Review blog before posting
export const reviewBlog = async (content, blogId = null) => {
  const response = await api.post('/blog/review', { content, blogId });
  return response.data;
};

// Check content for plagiarism/AI
export const checkContent = async (content) => {
  const response = await api.post('/blog/check', { content });
  return response.data;
};

// Save/create blog
export const saveBlog = async (blogData) => {
  const response = await api.post('/blogs', blogData);
  return response.data;
};

// Update blog
export const updateBlog = async (blogId, blogData) => {
  const response = await api.put(`/blogs/${blogId}`, blogData);
  return response.data;
};

// Delete blog
export const deleteBlog = async (blogId) => {
  const response = await api.delete(`/blogs/${blogId}`);
  return response.data;
};

// Get user's blogs
export const getMyBlogs = async (page = 1, limit = 10, status = '') => {
  let url = `/blogs/my?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  const response = await api.get(url);
  return response.data;
};

// Get public blog feed
export const getBlogFeed = async (params = {}) => {
  const { page = 1, limit = 10, tag, category, author, sort = 'latest' } = params;
  let url = `/blogs/feed?page=${page}&limit=${limit}&sort=${sort}`;
  if (tag) url += `&tag=${tag}`;
  if (category) url += `&category=${category}`;
  if (author) url += `&author=${author}`;
  const response = await api.get(url);
  return response.data;
};

// Get single blog
export const getBlog = async (blogId) => {
  const response = await api.get(`/blogs/${blogId}`);
  return response.data;
};

// Like/unlike blog
export const toggleBlogLike = async (blogId) => {
  const response = await api.post(`/blogs/${blogId}/like`);
  return response.data;
};

// Bookmark/unbookmark blog
export const toggleBlogBookmark = async (blogId) => {
  const response = await api.post(`/blogs/${blogId}/bookmark`);
  return response.data;
};

// Get bookmarked blogs
export const getBookmarkedBlogs = async (page = 1, limit = 10) => {
  const response = await api.get(`/blogs/user/bookmarks?page=${page}&limit=${limit}`);
  return response.data;
};

// Get comments for a blog
export const getComments = async (blogId, page = 1, limit = 20, sort = 'latest') => {
  const response = await api.get(`/comments/${blogId}?page=${page}&limit=${limit}&sort=${sort}`);
  return response.data;
};

// Add comment
export const addComment = async (blogId, comment, parentCommentId = null) => {
  const response = await api.post(`/comments/${blogId}`, { comment, parentCommentId });
  return response.data;
};

// Like comment
export const toggleCommentLike = async (blogId, commentId) => {
  const response = await api.post(`/comments/${blogId}/like/${commentId}`);
  return response.data;
};

// Delete comment
export const deleteComment = async (blogId, commentId) => {
  const response = await api.delete(`/comments/${blogId}/${commentId}`);
  return response.data;
};

// Report comment
export const reportComment = async (blogId, commentId, reason) => {
  const response = await api.post(`/comments/${blogId}/report/${commentId}`, { reason });
  return response.data;
};

// Get assignment by ID
export const getAssignment = async (assignmentId) => {
  const response = await api.get(`/evaluate/${assignmentId}`);
  return response.data;
};

export default {
  evaluateAssignment,
  evaluateText,
  getQuickFeedback,
  sendChatMessage,
  getChatHistory,
  getChatSession,
  deleteChatSession,
  exportChat,
  generateBlog,
  reviewBlog,
  checkContent,
  saveBlog,
  updateBlog,
  deleteBlog,
  getMyBlogs,
  getBlogFeed,
  getBlog,
  toggleBlogLike,
  toggleBlogBookmark,
  getBookmarkedBlogs,
  getComments,
  addComment,
  toggleCommentLike,
  deleteComment,
  reportComment,
  getAssignment
};
