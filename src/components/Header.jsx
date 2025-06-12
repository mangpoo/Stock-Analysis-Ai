// Header.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useUser } from '../contexts/UserContext';
import api from '../api'; // ✅ axios 인스턴스 import
import './Header.css';
import API_CONFIG from '../config'; // 경로는 프로젝트 구조에 따라 조정

export default function Header() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [message, setMessage] = useState(''); // 검색 및 로그인 메시지용
    const [showResults, setShowResults] = useState(false);
    const searchContainerRef = useRef(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    // const [userName, setUserName] = useState(''); // 선택 사항: 사용자 이름 표시용

    const navigate = useNavigate();

    // 로그인 삽입 1번 ==========

    // ✅ 페이지 새로고침 시 JWT 토큰으로 로그인 상태 유지
    const { user, setUser } = useUser(); 
    useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => {
        setUser(res.data);
        console.log("🔄 토큰으로 로그인 유지");
      })
      .catch(err => {
        console.warn("❌ 토큰 인증 실패 또는 만료:", err);
        localStorage.removeItem('jwt_token');
      });
    }
  }, [setUser]);
    
    // 로그인 삽입 1번 끝 ==========

    // 로그인 삽입 2번 ==========

    // 로그인 로직
  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        // 1단계: Google 사용자 정보 요청
        const res = await api.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        const userInfo = res.data;
        setUser(userInfo); // Context에 사용자 정보 저장

        // 2단계: 백엔드에 사용자 정보 전송 → JWT 발급
        const jwtRes = await api.post('/login', userInfo);

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

  // 로그인 삽입 2번 끝 ==========





    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchContainerRef]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            // 로그인 관련 메시지인 경우 여기서 메시지를 지우지 마십시오.
            // setMessage('');
            setShowResults(false);
            return;
        }

        setShowResults(true);
        setMessage(''); // 새 검색 시작 시 이전 메시지 지우기

        const timeoutId = setTimeout(async () => {
            try {
                const apiUrl = API_CONFIG.endpoints.search(query);
                console.log(`검색 요청: ${apiUrl}`);
                const res = await fetch(apiUrl);

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`네트워크 응답 오류: ${res.status} - ${errorText}`);
                }
                const data = await res.json();
                if (data.length === 0) {
                    setResults([]);
                    
                } else {
                    setResults(data);
                    setMessage('');
                }
            } catch (error) {
                console.error('검색 중 오류 발생:', error);
                setResults([]);
                if (error.message.includes('Failed to fetch')) {
                    setMessage('서버 연결에 실패했습니다. CORS 또는 네트워크 설정을 확인하세요.');
                } else {
                    setMessage('검색 중 오류가 발생했습니다.');
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleResultClick = (item) => {
        navigate(`/chart/${item.ticker}`, {
            state: {
                stockName: item.name,
                stockType: item.source // 'stockSource' 대신 'stockType'으로 전달
            }
        });
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    

    

    return (
        <header className="header">
            <div className="search-container" ref={searchContainerRef}>
                <input
                    className="search-input"
                    placeholder="🔍 검색"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { if(query) setShowResults(true); setMessage('');}} // 포커스 시 메시지 지우기
                    autoComplete="off"
                />
                {showResults && query.length > 0 && (
                    <div className="search-results">
                        {results.length > 0 && (
                            <ul>
                                {results.map((item) => (
                                    <li
                                        key={item.ticker}
                                        onClick={() => handleResultClick(item)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {`[${item.ticker}] ${item.name} (${item.source})`}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* 검색 관련 메시지 표시 */}
                        {message && results.length === 0 && query.length > 0 && <div className="search-message">{message}</div>}
                    </div>
                )}
            </div>



            {user ? (
              <div className="user-info">
                <img src={user.picture} alt="프로필" className="user-pic" />
                <span>{user.name} 님</span>
                <button className="logout-btn" onClick={logout}>로그아웃</button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => login()}>로그인</button>
            )}



            {/* 검색 결과가 표시되지 않을 경우 일반/로그인 오류 메시지 표시 */}
            {message && (!showResults || results.length === 0 && query.length === 0) && <div className="header-message" style={{ color: 'red', marginLeft: '10px', flexGrow: 1, textAlign: 'center' }}>{message}</div>}
        </header>
    );
}