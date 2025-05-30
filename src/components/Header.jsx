import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
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

    // 컴포넌트 마운트 시 로그인 상태 확인
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
            // const storedUserName = localStorage.getItem('userName'); // 사용자 이름을 저장한 경우
            // if (storedUserName) setUserName(storedUserName);
            // 여기서 백엔드에 토큰 유효성 검사 호출을 추가할 수 있습니다.
        }
    }, []);

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
                    setMessage('검색 결과가 없습니다.');
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
                stockSource: item.source
            }
        });
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    const googleLogin = useGoogleLogin({
        flow: 'auth-code', // 이것은 인증 코드를 제공합니다.
        onSuccess: async (codeResponse) => {
            console.log("Google 로그인 성공 (인증 코드):", codeResponse.code);
            const { code } = codeResponse;

            try {
                const backendApiUrl = API_CONFIG.endpoints.googleLoginCallback();
                const response = await fetch(backendApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }), // 백엔드로 인증 코드 전송
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`백엔드 인증 실패: ${response.status} - ${errorData}`);
                }

                const { accessToken, isNewUser /*, userName: backendUserName */ } = await response.json(); // 백엔드 응답 구조에 따라 조정

                const tokenExistsBefore = localStorage.getItem('accessToken');
                localStorage.setItem('accessToken', accessToken);
                // if (backendUserName) localStorage.setItem('userName', backendUserName);

                setIsLoggedIn(true);
                // if (backendUserName) setUserName(backendUserName);
                setMessage(''); // 이전 오류 메시지 지우기

                if (!tokenExistsBefore) {
                    // 이전에 토큰이 없었다면, 앱의 모든 부분이 새 로그인 상태를 인식하도록 페이지 새로고침
                    window.location.reload();
                } else {
                    // 토큰이 이미 있었다면 (예: 세션 만료 후 재로그인), 그냥 이동
                    if (isNewUser) { // 또는 백엔드 응답에 따라 (예: !isRegistered, needsSignup)
                        navigate('/signup'); // 회원가입 완료 페이지로 이동
                    } else {
                        navigate('/'); // 메인 페이지로 이동
                    }
                }
            } catch (error) {
                console.error('백엔드로 코드 전송 또는 응답 처리 중 오류:', error);
                setMessage('로그인 처리 중 오류가 발생했습니다.');
            }
        },
        onError: (errorResponse) => {
            console.error('Google 로그인 실패:', errorResponse);
            setMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.');
        },
    });

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        // localStorage.removeItem('userName');
        setIsLoggedIn(false);
        // setUserName('');
        setMessage('');
        // 선택 사항: 백엔드에 로그아웃 알림
        navigate('/');
        window.location.reload(); // 앱 전체에서 깨끗한 상태를 보장하기 위해 새로고침
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
            {isLoggedIn ? (
                <>
                    {/* 선택 사항: 환영 메시지 
                    {userName && <span style={{ color: 'white', marginRight: '15px' }}>{userName}님</span>}
                    */}
                    <button onClick={handleLogout} className="login-btn">로그아웃</button>
                </>
            ) : (
                <button onClick={() => googleLogin()} className="login-btn">
                    로그인
                </button>
            )}
            {/* 검색 결과가 표시되지 않을 경우 일반/로그인 오류 메시지 표시 */}
            {message && (!showResults || results.length === 0 && query.length === 0) && <div className="header-message" style={{ color: 'red', marginLeft: '10px', flexGrow: 1, textAlign: 'center' }}>{message}</div>}
        </header>
    );
}