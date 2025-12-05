import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebaseAuth';
import { syncUserProfile, getUserProfile } from '../services/firebaseDB';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Sync and get profile from backend
        try {
          const profile = await syncUserProfile(firebaseUser);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error syncing profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Email verification disabled for hackathon demo
      // if (!result.user.emailVerified) {
      //   toast.error('Please verify your email before logging in');
      //   await signOut(auth);
      //   setAuthLoading(false);
      //   return { success: false, error: 'Email not verified' };
      // }
      
      toast.success('Welcome back!');
      return { success: true, user: result.user };
    } catch (error) {
      const message = getErrorMessage(error.code);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(result.user, { displayName: name });
      
      // Email verification disabled for hackathon demo
      // await sendEmailVerification(result.user);
      // await signOut(auth);
      
      toast.success('Account created! You can now use the app.');
      return { success: true, message: 'Account created' };
    } catch (error) {
      const message = getErrorMessage(error.code);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error.code);
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resendVerification = async () => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        toast.success('Verification email sent!');
        return { success: true };
      } catch (error) {
        toast.error('Error sending verification email');
        return { success: false };
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const getToken = async () => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  const value = {
    user,
    userProfile,
    loading,
    authLoading,
    login,
    register,
    logout,
    resetPassword,
    resendVerification,
    refreshProfile,
    getToken,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    default:
      return 'An error occurred. Please try again';
  }
}
