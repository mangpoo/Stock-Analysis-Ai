// Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import './Header.css';
import API_CONFIG from '../config';
import { stockApi, authApi } from '../api'; // ✅ 두 개의 axios 인스턴스 import

export default function Header() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [message, setMessage] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchContainerRef = useRef(null);

    const [user, setUser] = useState(null); // 사용자 정보 상태

    const navigate = useNavigate();

    // --- 로그인 상태 유지 로직 (컴포넌트 마운트 시 실행) ---
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // ✅ 인증 API 인스턴스 'authApi' 사용
            authApi.post(API_CONFIG.endpoints.verifyToken(), { token })
                .then(res => {
                    const { user_id, name, picture, email } = res.data; // 백엔드 응답 구조에 따라 조정
                    setUser({ id: user_id, name, picture, email });
                    console.log("🔄 토큰으로 로그인 유지 성공:", email);
                })
                .catch(err => {
                    console.warn("❌ 토큰 인증 실패 또는 만료:", err);
                    localStorage.removeItem('accessToken');
                    setUser(null);
                });
        }
    }, []);

    // --- 검색 결과 창 외부 클릭 시 닫기 로직 (기존과 동일) ---
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

    // --- 검색 로직 (query 변경 시 실행) ---
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setShowResults(true);
        setMessage('');

        const timeoutId = setTimeout(async () => {
            try {
                const apiUrl = API_CONFIG.endpoints.search(query);
                console.log(`검색 요청: ${apiUrl}`);

                // ✅ 주식 API 인스턴스 'stockApi' 사용
                const res = await stockApi.get(apiUrl);

                if (res.data.length === 0) {
                    setResults([]);
                    setMessage('검색 결과가 없습니다.');
                } else {
                    setResults(res.data);
                    setMessage('');
                }
            } catch (error) {
                console.error('검색 중 오류 발생:', error);
                setResults([]);
                if (error.response) {
                    setMessage(`검색 중 오류가 발생했습니다: ${error.response.status} - ${error.response.statusText}`);
                } else if (error.request) {
                    setMessage('서버 연결에 실패했습니다. 네트워크 설정을 확인하세요.');
                } else {
                    setMessage('검색 중 알 수 없는 오류가 발생했습니다.');
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // --- 검색 입력 변경 핸들러 (기존과 동일) ---
    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    // --- 검색 결과 클릭 핸들러 (기존과 동일) ---
    const handleResultClick = (item) => {
        navigate(`/chart/${item.ticker}`, {
            state: {
                stockName: item.name,
                stockType: item.source
            }
        });
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    // --- Google 로그인 로직 ---
    const googleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (codeResponse) => {
            console.log("Google 로그인 성공 (인증 코드):", codeResponse.code);
            const { code } = codeResponse;

            try {
                const backendApiUrl = API_CONFIG.endpoints.googleLoginCallback();

                // ✅ 인증 API 인스턴스 'authApi' 사용
                const response = await authApi.post(backendApiUrl, { code });

                if (response.data && response.data.token) {
                    localStorage.setItem('accessToken', response.data.token);
                    const { user_id, name, picture, email } = response.data.user; // 백엔드 응답 구조에 따라 조정
                    setUser({ id: user_id, name, picture, email });

                    console.log("✅ JWT 토큰 저장 완료 및 로그인 성공");
                    setMessage('');

                    if (response.data.isNewUser) {
                        navigate('/signup');
                    } else {
                        navigate('/');
                        window.location.reload();
                    }
                } else {
                    console.warn("⚠️ JWT 토큰이 백엔드 응답에 없습니다.");
                    setMessage("로그인에 실패했습니다: 토큰이 없습니다.");
                }
            } catch (error) {
                console.error('❌ 백엔드로 코드 전송 또는 응답 처리 중 오류:', error);
                if (error.response) {
                    setMessage(`로그인 처리 중 오류가 발생했습니다: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
                } else if (error.request) {
                    setMessage('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.');
                } else {
                    setMessage('로그인 처리 중 알 수 없는 오류가 발생했습니다.');
                }
            }
        },
        onError: (errorResponse) => {
            console.error('❌ Google 로그인 실패:', errorResponse);
            setMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.');
        },
    });

    // --- 로그아웃 로직 (기존과 동일) ---
    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        setMessage('');
        console.log("🚪 로그아웃 완료");
        navigate('/');
        window.location.reload();
    };

    return (
        <header className="header">
            <div className="search-container" ref={searchContainerRef}>
                <input
                    className="search-input"
                    placeholder="🔍 검색"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { if (query) setShowResults(true); setMessage(''); }}
                    autoComplete="off"
                />
                {showResults && query.length > 0 && (
                    <div className="search-results">
                        {results.length > 0 ? (
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
                        ) : (
                            <div className="search-message">{message}</div>
                        )}
                    </div>
                )}
            </div>

            {user ? (
                <div className="user-info">
                    <img src={user.picture || 'https://via.placeholder.com/30'} alt="프로필" className="user-pic" />
                    <span>{user.name} 님</span>
                    <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
                </div>
            ) : (
                <button onClick={() => googleLogin()} className="login-btn">
                    로그인
                </button>
            )}

            {message && (!showResults || (results.length === 0 && query.length === 0)) &&
                <div className="header-message" style={{ color: 'red', marginLeft: '10px', flexGrow: 1, textAlign: 'center' }}>{message}</div>
            }
        </header>
    );
}