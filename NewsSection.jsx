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
      
      // 1. 최신 데이터 참조 정보 가져오기
      const latestResponse = await fetch(`/news/latest.json?t=${new Date().getTime()}`);
      
      if (!latestResponse.ok) {
        throw new Error('최신 뉴스 정보를 불러올 수 없습니다.');
      }
      
      const latestInfo = await latestResponse.json();
      console.log('최신 뉴스 정보:', latestInfo);
      
      // 2. 실제 뉴스 데이터 가져오기
      const newsResponse = await fetch(`${latestInfo.data_path}?t=${new Date().getTime()}`);
      
      if (!newsResponse.ok) {
        throw new Error('뉴스 데이터를 불러올 수 없습니다.');
      }
      
      const newsData = await newsResponse.json();
      
      // 3. 데이터 병합하여 상태 업데이트
      setNewsData({
        ...newsData,
        current_date: latestInfo.current_date,
        data_path: latestInfo.data_path
      });
      
      console.log('뉴스 데이터 로드 완료:', newsData);
      
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