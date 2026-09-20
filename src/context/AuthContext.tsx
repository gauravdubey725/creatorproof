import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api, getAuthToken, setAuthToken } from '../utils/api';

// Robust RFC-compliant email regex: requires valid local-part, @, domain, and 2+ char TLD
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const USER_CACHE_KEY = 'creatorproof_user_profile';

export const mapBackendUserToProfile = (u: any): UserProfile => {
  if (!u) {
    return {
      name: 'Creator',
      email: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      walletAddress: '0x0000...0000',
      role: 'Verified Creator',
      organization: 'Independent Creator',
      network: 'Polygon PoS / Sepolia'
    };
  }

  const wallet = u.wallet_address || u.walletAddress || '';
  const formattedWallet = wallet.length > 10
    ? `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`
    : wallet || '0x71C...8976';

  return {
    name: u.name || u.username || 'Creator',
    username: u.username || (u.email ? u.email.split('@')[0] : ''),
    email: u.email || '',
    phone: u.phone || '',
    avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    walletAddress: formattedWallet,
    role: u.role || 'Verified Creator',
    organization: u.organization || 'Independent Creator',
    network: u.network || 'Polygon PoS / Sepolia'
  };
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, username: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateUserProfile: (partial: Partial<UserProfile>) => Promise<void>;
  updateUser: (partial: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check persistent session on app startup
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.auth.getMe(token);
        if (isMounted && res.success && res.user) {
          const profile = mapBackendUserToProfile(res.user);
          setUser(profile);
          setIsAuthenticated(true);
          try {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
          } catch {}
        } else {
          throw new Error('Session invalid');
        }
      } catch (err: any) {
        console.warn('[AuthContext] Session verification error:', err.message);
        // If server 401 or token expired, clear token
        if (err.status === 401 || err.status === 403 || err.message?.includes('token')) {
          setAuthToken(null);
          try {
            localStorage.removeItem(USER_CACHE_KEY);
          } catch {}
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // If network error, recover cached profile without password
          try {
            const cached = localStorage.getItem(USER_CACHE_KEY);
            if (cached && isMounted) {
              setUser(JSON.parse(cached));
              setIsAuthenticated(true);
            }
          } catch {}
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim();

    if (cleanId.includes('@') && !EMAIL_REGEX.test(cleanId)) {
      return { success: false, error: 'Invalid email address format (e.g. user@domain.com).' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const res = await api.auth.login(cleanId, password);
      if (res.success && res.token) {
        setAuthToken(res.token);
        const profile = mapBackendUserToProfile(res.user);
        setUser(profile);
        setIsAuthenticated(true);
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
        } catch {}
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials or login failed.' };
    } catch (err: any) {
      console.error('[AuthContext] Login error:', err);
      return { success: false, error: err.message || 'Login failed. Please verify credentials.' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return { success: false, error: 'Invalid email address format (e.g. user@domain.com).' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }

    // Backend validator requires name without numbers: /^[a-zA-Z\s\-\'\.]{2,}$/
    if (cleanName && cleanName.length >= 2 && !/^[a-zA-Z\s\-\'\.]{2,}$/.test(cleanName)) {
      return { success: false, error: 'Name must contain only letters, spaces, hyphens, and apostrophes (min 2 characters).' };
    }

    try {
      const res = await api.auth.signup({
        email: cleanEmail,
        password,
        name: cleanName || cleanUsername,
        username: cleanUsername
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        const profile = mapBackendUserToProfile(res.user);
        setUser(profile);
        setIsAuthenticated(true);
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
        } catch {}
        return { success: true };
      }

      return { success: false, error: 'Registration failed.' };
    } catch (err: any) {
      console.error('[AuthContext] Signup error:', err);
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const demoLogin = async (): Promise<void> => {
    const demoEmail = 'alex.vance@creatorproof.io';
    const demoPassword = 'Password123!';
    const demoName = 'Alex Vance';
    const demoUsername = 'alexvance';

    // Attempt login first
    const loginResult = await login(demoEmail, demoPassword);
    if (loginResult.success) {
      return;
    }

    // If demo user does not exist in DB yet, create it
    const signupResult = await signup(demoEmail, demoPassword, demoName, demoUsername);
    if (!signupResult.success) {
      // If already exists or error, try login one more time
      await login(demoEmail, demoPassword);
    }
  };

  const logout = () => {
    setAuthToken(null);
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem('mockToken');
      localStorage.removeItem('mockUser');
      localStorage.removeItem('creatorproof_mock_users');
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserProfile = async (partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await api.auth.updateProfile({
        name: partial.name,
        phone: partial.phone
      });
    } catch (err: any) {
      console.warn('[AuthContext] Could not sync profile update with server:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        demoLogin,
        logout,
        updateUserProfile,
        updateUser: updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
