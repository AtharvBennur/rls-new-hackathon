import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  PenTool, 
  Globe, 
  User, 
  X,
  Award,
  TrendingUp
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/evaluator', icon: FileText, label: 'Assignment Evaluator' },
  { to: '/feedback', icon: MessageSquare, label: 'Quick Feedback' },
  { to: '/generator', icon: PenTool, label: 'Blog Generator' },
  { to: '/blogs', icon: Globe, label: 'Public Blogs' },
  { to: '/account', icon: User, label: 'My Account' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { userProfile } = useAuth();

  return (
    <aside className={`
      fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transform transition-transform duration-300 ease-in-out
      lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <span className="text-lg font-bold text-white">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">AI-Assign-Eval</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Smart Evaluator</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all
              ${isActive 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Stats Card */}
      {userProfile && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Level {userProfile.level || 1}</p>
                <p className="text-xs text-white/80">{userProfile.points || 0} points</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{((userProfile.points || 0) % 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(userProfile.points || 0) % 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
