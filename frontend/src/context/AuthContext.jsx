import { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const parsedNode = JSON.parse(storedUser);
        setUser(parsedNode);
        // Silently fetch fresh user gamification data
        try {
          // Temporarily set bearer
          api.defaults.headers.common['Authorization'] = `Bearer ${parsedNode.token}`;
          const { data } = await api.get('/auth/me');
          const merged = { ...parsedNode, xp: data.xp, level: data.level, badges: data.badges };
          setUser(merged);
          localStorage.setItem('userInfo', JSON.stringify(merged));
        } catch(e) {}
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };
  
  const updateXp = async (amount, reason) => {
    try {
      const { data } = await api.post('/auth/xp', { amount, reason });
      setUser(prev => {
        const fresh = { ...prev, xp: data.xp, level: data.level };
        localStorage.setItem('userInfo', JSON.stringify(fresh));
        return fresh;
      });
      if (data.leveledUp) {
        alert(`LEVEL UP! You are now Level ${data.level}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateXp }}>
      {children}
    </AuthContext.Provider>
  );
};
