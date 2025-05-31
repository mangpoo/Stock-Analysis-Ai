// src/contexts/UserContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ 마운트 시 localStorage에서 사용자 정보 불러오기 (예외 처리 포함)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.warn('❌ 사용자 정보 로딩 실패:', err);
      localStorage.removeItem('user');
    }
  }, []);

  // ✅ user 변경 시 localStorage에 반영
  useEffect(() => {
    try {
      if (user && typeof user === 'object') {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.warn('❌ 사용자 정보 저장 실패:', err);
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
