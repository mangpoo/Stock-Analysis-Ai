import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate 훅을 import 합니다.
import './Header.css';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);
  const IP = "172.17.154.182:8080"; // 검색 API 서버 IP

  const navigate = useNavigate(); // 2. useNavigate 훅을 초기화합니다.

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
      setMessage('');
      setShowResults(false);
      return;
    }

    setShowResults(true);

    const timeoutId = setTimeout(async () => {
      try {
        const apiUrl = `http://${IP}/search?q=${encodeURIComponent(query)}`;
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
  }, [query, IP]); // IP 주소도 의존성 배열에 추가

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  // 3. 검색 결과 항목 클릭 시 호출될 함수를 정의합니다.
  const handleResultClick = (item) => {
    // ChartPage로 이동하면서 URL 파라미터로 ticker를, state로 종목명과 종목 소스(출처)를 전달합니다.
    navigate(`/chart/${item.ticker}`, {
      state: {
        stockName: item.name,     // 종목명 전달
        stockSource: item.source  // 종목 출처(예: KRX, NASDAQ) 전달
      }
    });

    // 검색창을 비우고 결과 목록을 숨깁니다.
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
          onFocus={() => query && setShowResults(true)}
          autoComplete="off"
        />
        {showResults && query.length > 0 && (
          <div className="search-results">
            {results.length > 0 && (
              <ul>
                {results.map((item) => (
                  // 4. li 요소에 onClick 이벤트를 추가하고 handleResultClick 함수를 연결합니다.
                  <li
                    key={item.ticker}
                    onClick={() => handleResultClick(item)}
                    style={{ cursor: 'pointer' }} // 클릭 가능하다는 것을 알려주기 위해 커서 스타일 추가
                  >
                    {`[${item.ticker}] ${item.name} (${item.source})`}
                  </li>
                ))}
              </ul>
            )}
            {message && <div className="search-message">{message}</div>}
          </div>
        )}
      </div>
      <button className="login-btn">로그인</button>
    </header>
  );
}