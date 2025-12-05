import { auth } from './firebaseAuth';
import api from './api';

// Sync user profile with backend after authentication
export const syncUserProfile = async (firebaseUser) => {
  try {
    const token = await firebaseUser.getIdToken();
    
    const response = await api.post('/auth/sync', {
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
      bio: ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.user;
  } catch (error) {
    console.error('Error syncing user profile:', error);
    throw error;
  }
};

// Get user profile from backend
export const getUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.user;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.put('/auth/profile', profileData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get user stats
export const getUserStats = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.get('/auth/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

// Get dashboard data
export const getDashboardData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.get('/history/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.dashboard;
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
};

// Get assignment history
export const getAssignmentHistory = async (page = 1, limit = 10) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.get(`/history/assignments?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting assignment history:', error);
    throw error;
  }
};

// Get blog history
export const getBlogHistory = async (page = 1, limit = 10, status = '') => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    let url = `/history/blogs?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    
    const response = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting blog history:', error);
    throw error;
  }
};

// Get learning recommendations
export const getLearningRecommendations = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.get('/history/recommendations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

// Get progress data
export const getProgressData = async (days = 30) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await api.get(`/history/progress?period=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting progress data:', error);
    throw error;
  }
};
