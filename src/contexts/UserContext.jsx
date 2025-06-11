// src/contexts/UserContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // ✅ 마운트 시 localStorage에서 사용자 정보 불러오기 (예외 처리 포함)
  useEffect(() => {
    // ⚠️ JWT 방식으로 전환되었기 때문에 사용자 정보는 localStorage에서 불러오지 않음
  }, []);

  // ✅ user 변경 시 localStorage에 반영
  useEffect(() => {
    // ⚠️ JWT 방식으로 전환되었기 때문에 사용자 정보를 localStorage에 저장하지 않음
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
