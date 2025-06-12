import React, { useState, useEffect } from 'react';
import './NewsSection.css';

export default function NewsSection() {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Directly fetch news data from the provided endpoint
      const newsResponse = await fetch(`https://ddolddol2.duckdns.org/api/get_main_news?t=${new Date().getTime()}`);

      if (!newsResponse.ok) {
        throw new Error('최신 뉴스 정보를 불러올 수 없습니다.');
      }

      const data = await newsResponse.json();

      // Ensure the 'news' array exists in the fetched data
      if (data && Array.isArray(data.news)) {
        setNewsData(data);
        console.log('뉴스 데이터 로드 완료:', data);
      } else {
        throw new Error('뉴스 데이터 형식이 올바르지 않습니다.');
      }

    } catch (err) {
      console.error('뉴스 로딩 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();

    // 5분마다 자동 새로고침
    const interval = setInterval(loadNews, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadNews();
  };

  if (loading) {
    return (
      <div className="news-section">
        <div className="news-header">
          <h2>실시간 뉴스</h2>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            새로고침
          </button>
        </div>
        <div className="loading-message">뉴스 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-section">
        <div className="news-header">
          <h2>실시간 뉴스</h2>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
          >
            다시 시도
          </button>
        </div>
        <div className="error-message">
          오류가 발생했습니다: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="news-section">
      <div className="news-header">
        <h2>실시간 뉴스</h2>
        <div className="news-meta">
            {/* Added refresh button here for consistency with loading/error states */}
            
        </div>
      </div>

      <div className="news-content-wrapper">
        {newsData?.news?.length > 0 ? (
          <>
            {/* 메인 뉴스 (첫 번째 뉴스) */}
            {newsData.news[0] && (
              <div className="main-news">
                <div className="main-news-image-container">
                  {newsData.news[0].image_url ? (
                    <img
                      src={newsData.news[0].image_url}
                      alt={newsData.news[0].title}
                      className="main-news-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="no-image-placeholder" style={{ display: newsData.news[0].image_url ? 'none' : 'flex' }}>
                    이미지 없음
                  </div>
                  <div className="main-news-overlay">
                    <h2
                      className="main-news-title"
                      onClick={() => window.open(newsData.news[0].link, '_blank')}
                    >
                      {newsData.news[0].title}
                    </h2>
                    <div className="main-news-preview">{newsData.news[0].content}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 사이드 뉴스 리스트 (나머지 뉴스들) */}
            {newsData.news.length > 1 && (
              <div className="side-news-list">
                {newsData.news.slice(1).map((news, index) => (
                  <div key={index + 1} className="side-news-item">
                    <div className="side-news-image-container">
                      {news.image_url ? (
                        <img
                          src={news.image_url}
                          alt={news.title}
                          className="side-news-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="side-no-image-placeholder" style={{ display: news.image_url ? 'none' : 'flex' }}>
                        이미지 없음
                      </div>
                    </div>
                    <div className="side-news-content">
                      <h3
                        className="side-news-title"
                        onClick={() => window.open(news.link, '_blank')}
                      >
                        {news.title}
                      </h3>
                      <div className="side-news-preview">{news.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-news-message">
            표시할 뉴스가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}