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
        // 1단계: Google 사용자 정보 요청
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const userInfo = res.data;
        setUser(userInfo); // Context에 사용자 정보 저장

        // 2단계: 백엔드에 사용자 정보 전송 → JWT 발급
        const jwtRes = await axios.post('http://localhost:5000/login', userInfo);

        if (jwtRes.data && jwtRes.data.token) {
          // 3단계: JWT 토큰 저장
          localStorage.setItem('jwt_token', jwtRes.data.token);
          console.log("✅ JWT 토큰 저장 완료");
        } else {
          console.warn("⚠️ JWT 토큰이 응답에 없습니다.");
        }

      } catch (error) {
        console.error('❌ 사용자 정보 요청 또는 백엔드 전송 실패:', error);
      }
    },
    onError: err => console.error('❌ 로그인 실패:', err),
  });

  // 로그아웃 로직
  const logout = () => {
    setUser(null);
    localStorage.removeItem('jwt_token'); // 저장된 토큰 제거
    console.log("🚪 로그아웃 완료");
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
