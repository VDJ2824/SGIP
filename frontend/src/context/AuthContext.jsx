import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearPendingAuth,
  clearStoredAuth,
  getPendingAuth,
  getStoredToken,
  getStoredUser,
  setPendingAuth,
  setStoredToken,
  setStoredUser,
} from '@/utils/authStorage';
import {
  fetchAuthProfile,
  loginUser,
  logoutUser,
  registerUser,
  verifyLoginOtp,
  verifyRegisterOtp,
} from '@/services/authService';

const defaultAuthContext = {
  user: null,
  token: '',
  pendingAuth: { email: '', flow: '' },
  authLoading: false,
  isAuthenticated: false,
  register: async () => {
    throw new Error('AuthProvider is not available');
  },
  confirmRegisterOtp: async () => {
    throw new Error('AuthProvider is not available');
  },
  login: async () => {
    throw new Error('AuthProvider is not available');
  },
  confirmLoginOtp: async () => {
    throw new Error('AuthProvider is not available');
  },
  refreshProfile: async () => null,
  logout: async () => {},
  setPendingAuth: () => {},
};

const AuthContext = createContext(defaultAuthContext);

function persistSession(user, token) {
  setStoredToken(token);
  setStoredUser(user);
  if (user?.role === 'student') {
    localStorage.setItem('sgip_student_id', user?._id || user?.id || '');
  } else {
    localStorage.removeItem('sgip_student_id');
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  const [pendingAuth, setPendingAuthState] = useState(getPendingAuth());

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!token) {
        if (active) setAuthLoading(false);
        return;
      }

      try {
        const response = await fetchAuthProfile();
        const profile = response.data;
        if (!active) return;
        setUser(profile);
        persistSession(profile, token);
      } catch {
        if (!active) return;
        clearStoredAuth();
        setUser(null);
        setToken('');
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, [token]);

  const syncSession = (sessionUser, sessionToken) => {
    setUser(sessionUser);
    setToken(sessionToken);
    persistSession(sessionUser, sessionToken);
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    setPendingAuthState({ email: payload.email, flow: 'register' });
    setPendingAuth({ email: payload.email, flow: 'register' });
    return response.data;
  };

  const confirmRegisterOtp = async (payload) => {
    const response = await verifyRegisterOtp(payload);
    clearPendingAuth();
    setPendingAuthState({ email: '', flow: '' });
    return response.data;
  };

  const login = async (payload) => {
    const response = await loginUser(payload);
    setPendingAuthState({ email: payload.email, flow: 'login' });
    setPendingAuth({ email: payload.email, flow: 'login' });
    return response.data;
  };

  const confirmLoginOtp = async (payload) => {
    const response = await verifyLoginOtp(payload);
    syncSession(response.data.user, response.data.token);
    clearPendingAuth();
    setPendingAuthState({ email: '', flow: '' });
    return response.data;
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const response = await fetchAuthProfile();
    const profile = response.data;
    setUser(profile);
    persistSession(profile, token);
    return profile;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Logging out is client-side safe even if the server is unavailable.
    }
    clearStoredAuth();
    clearPendingAuth();
    setPendingAuthState({ email: '', flow: '' });
    setUser(null);
    setToken('');
  };

  const value = useMemo(
    () => ({
      user,
      token,
      pendingAuth,
      authLoading,
      isAuthenticated: Boolean(token && user),
      register,
      confirmRegisterOtp,
      login,
      confirmLoginOtp,
      refreshProfile,
      logout,
      setPendingAuth: setPendingAuthState,
    }),
    [authLoading, pendingAuth, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
