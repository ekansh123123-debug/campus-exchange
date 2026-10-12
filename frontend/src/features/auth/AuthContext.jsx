import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, clearAuthTokens, setAuthTokens } from '../../lib/api-client.js';
import { queryClient } from '../../lib/query-client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await apiRequest('/auth/me');
      if (response?.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiRequest('/auth/refresh', { method: 'POST', skipRefresh: true });
        if (res?.data?.accessToken) {
          setAuthTokens({
            token: res.data.accessToken,
            csrf: res.data.csrfToken,
          });
          if (mounted) {
            setUser(res.data.user || null);
          }
        }
      } catch {
        clearAuthTokens();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, collegeEmail, password }) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        collegeEmail: (collegeEmail || email || '').trim(),
        password,
      },
      skipRefresh: true,
    });
    if (res?.data?.accessToken) {
      setAuthTokens({
        token: res.data.accessToken,
        csrf: res.data.csrfToken,
      });
    }
    setUser(res?.data?.user || null);
    return res.data;
  }, []);

  const register = useCallback(async ({ fullName, email, collegeEmail, password, branch, academicYear }) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        fullName: fullName.trim(),
        collegeEmail: (collegeEmail || email || '').trim(),
        password,
        branch: branch || 'CSE',
        academicYear: String(academicYear || '1'),
      },
      skipRefresh: true,
    });
    return res.data;
  }, []);

  const verifyEmail = useCallback(async ({ email, collegeEmail, otp }) => {
    const res = await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: {
        collegeEmail: (collegeEmail || email || '').trim(),
        otp: String(otp || '').trim(),
      },
      skipRefresh: true,
    });
    if (res?.data?.accessToken) {
      setAuthTokens({
        token: res.data.accessToken,
        csrf: res.data.csrfToken,
      });
    }
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', skipRefresh: true });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthTokens();
      setUser(null);
      queryClient.clear();
    }
  }, []);

  const isVerifiedStudent = Boolean(user?.isEmailVerified || user?.verifiedStudent);
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated: Boolean(user),
        isVerifiedStudent,
        isAdmin,
        login,
        register,
        verifyEmail,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
