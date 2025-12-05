import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateUserProfile, getUserStats, getAssignmentHistory, getBlogHistory } from '../services/firebaseDB';
import toast from 'react-hot-toast';
import { User, Mail, Edit2, Save, Moon, Sun, Monitor, Award, FileText, CheckCircle, Loader2, Camera, Shield } from 'lucide-react';

export default function Account() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState({ assignments: [], blogs: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeTab === 'profile') loadStats();
    else if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const [assignments, blogs] = await Promise.all([
        getAssignmentHistory(1, 20),
        getBlogHistory(1, 20)
      ]);
      setHistory({ assignments: assignments.assignments || [], blogs: blogs.blogs || [] });
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ name, bio });
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'settings', label: 'Settings', icon: Shield }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile and preferences</p>
      </div>

      <div className="card p-1 inline-flex flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 md:col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    {userProfile?.profilePic ? (
                      <img src={userProfile.profilePic} alt="" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  {editing ? (
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input text-xl font-bold" />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile?.name || 'User'}</h2>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {user?.email}
                  </p>
                  {user?.emailVerified && (
                    <span className="badge-success mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              {editing ? (
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save</>}
                </button>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </button>
              )}
            </div>
            <div>
              <label className="label">Bio</label>
              {editing ? (
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input min-h-[100px]" placeholder="Tell us about yourself..." />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{userProfile?.bio || 'No bio yet'}</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Level</span>
                <span className="font-bold text-primary-600">{stats?.level || 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Points</span>
                <span className="font-bold">{stats?.points || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Evaluations</span>
                <span className="font-bold">{stats?.totalAssignmentsEvaluated || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Avg Score</span>
                <span className="font-bold">{(stats?.averageScore || 0).toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
          ) : (
            <>
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Assignment History</h3>
                {history.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {history.assignments.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.fileName}</p>
                          <p className="text-sm text-gray-500">{new Date(item.uploadDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`font-bold ${item.score >= 7 ? 'text-green-500' : item.score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {item.score}/10
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No assignments yet</p>
                )}
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Blog History</h3>
                {history.blogs.length > 0 ? (
                  <div className="space-y-3">
                    {history.blogs.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                          <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`badge ${item.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No blogs yet</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Badges</h3>
          {userProfile?.badges?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userProfile.badges.map((badge, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-medium text-gray-900 dark:text-white">{badge.name}</p>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Complete tasks to earn badges!</p>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
            <div className="flex gap-3">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' }
              ].map(opt => (
                <button key={opt.value} onClick={() => setThemeMode(opt.value)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}>
                  <opt.icon className={`w-6 h-6 mx-auto mb-2 ${theme === opt.value ? 'text-primary-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
