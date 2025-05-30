import React from 'react';
import './Header.css';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

export default function Header() {
  const { user, setUser } = useUser();

  // 로그인 로직
  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        setUser(res.data); // Context에 사용자 정보 저장
      } catch (error) {
        console.error('사용자 정보 요청 실패:', error);
      }
    },
    onError: err => console.error('로그인 실패:', err),
  });

  // 로그아웃 로직
  const logout = () => {
    setUser(null); // Context에서 사용자 정보 제거
  };

  return (
    <header className="header">
      <input className="search-input" placeholder="🔍 검색" />
      {user ? (
        <div className="user-info">
          <img src={user.picture} alt="프로필" className="user-pic" />
          <span>{user.name} 님</span>
          <button className="logout-btn" onClick={logout}>로그아웃</button>
        </div>
      ) : (
        <button className="login-btn" onClick={() => login()}>로그인</button>
      )}
    </header>
  );
}
