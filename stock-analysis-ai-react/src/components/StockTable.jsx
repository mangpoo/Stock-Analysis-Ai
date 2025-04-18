import React, { useState, useEffect } from "react";
import "./StockTable.css";
// import { FaRegHeart, FaHeart } from 'react-icons/fa'; // react-icons 사용 예시

export default function StockTable() {
  // --- 상태 관리 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [allChartData, setAllChartData] = useState([]);
  const [allChangeRankData, setAllChangeRankData] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 에러 상태 추가

  // --- 상수 ---
  const ITEMS_PER_PAGE = 10;

  // --- 데이터 로딩 ---
  useEffect(() => {
    // 1. 차트 데이터 로딩 (서버에서 가져오기)
    const fetchChartData = async () => {
      setLoading(true); // 로딩 시작
      setError(null); // 이전 에러 초기화
      try {
        const response = await fetch("http://172.17.153.114:5000/recommend/kr"); // 서버 주소
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`); // 에러 처리
        }
        const data = await response.json(); // JSON 파싱

        // 서버 데이터를 컴포넌트가 사용하는 형식으로 변환
        // 서버 데이터에 price와 change가 없으므로 임시값을 사용합니다.
        const transformedData = data.map(item => ({
          name: item["stock_name"],       // key "1"이 종목명으로 가정
          price: "N/A",        // 임시 가격 데이터
          change: 0.0          // 임시 등락률 데이터
        }));

        // 서버 데이터가 정확히 100개라고 가정합니다.
        // 만약 100개 이상일 경우 아래 slice를 사용하세요.
        // setAllChartData(transformedData.slice(0, 100));
        setAllChartData(transformedData); // 상태 업데이트

      } catch (e) {
        console.error("차트 데이터를 불러오는 중 오류 발생:", e);
        setError("데이터를 불러오는 데 실패했습니다."); // 에러 상태 설정
        setAllChartData([]); // 에러 시 빈 배열로 설정
      } finally {
        // 로딩 완료 (데이터 로딩과 별개로 변동순 데이터 로딩 전에 완료될 수 있음)
        // setLoading(false); // 변동순 데이터 로딩 후로 이동
      }
    };

    // 2. 변동순 데이터 로딩 (기존 예시 데이터 사용)
    const setupChangeRankData = () => {
        // 예시: 변동순 데이터 (isFavorite 속성 제거)
        // 실제로는 이 데이터도 서버에서 가져와야 할 수 있습니다.
        const fetchedChangeRankData = [
           { name: "카카오페이", change: 5.5 },
           { name: "네이버", change: 4.2 },
           { name: "HMM", change: 3.3 },
           { name: "하이브", change: 3.1 },
           { name: "두산밥캣", change: 2.8 },
           { name: "고려아연", change: 2.5 },
           { name: "셀트리온", change: 2.1 },
           { name: "LG디스플레이", change: 2.0 },
           { name: "아모레퍼시픽", change: 1.8 },
           { name: "KT&G", change: 1.2 },
           { name: "대한항공", change: 1.1 },
           { name: "SK이노베이션", change: 1.0 },
           // ... (더 많은 변동순 데이터)
         ].sort((a, b) => b.change - a.change);
         setAllChangeRankData(fetchedChangeRankData);
    };

    // 데이터 로딩 실행
    fetchChartData().then(() => {
        // 차트 데이터 로딩이 완료된 후 변동순 데이터 설정 및 로딩 상태 종료
        setupChangeRankData();
        setLoading(false); // 모든 데이터 로딩 완료
    });

  }, []); // 컴포넌트 마운트 시 1회 실행

  // --- 계산된 값 ---
  // (이하 코드는 변경 없음)
  const totalPages = Math.ceil(allChartData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentChartData = allChartData.slice(startIndex, endIndex);

  // --- 이벤트 핸들러 ---
  // (이하 코드는 변경 없음)
  const handleFavoriteClick = (stockName) => {
    console.log(`${stockName} 찜 상태 변경됨`);
  };

  const handlePageChange = (page) => {
    if (page === 'prev') {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    } else if (page === 'next') {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    } else {
      setCurrentPage(page);
    }
    console.log(`페이지 ${page === 'prev' ? currentPage - 1 : page === 'next' ? currentPage + 1 : page}로 이동 요청됨`);
  };

  // (renderPageNumbers 함수는 변경 없음)
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow + 1) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={i === currentPage ? 'active' : ''}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage === totalPages) {
          startPage = Math.max(1, totalPages - maxPagesToShow + 1);
      }

      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => handlePageChange(1)}>1</button>
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="start-ellipsis">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={i === currentPage ? 'active' : ''}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
        );
      }
    }
    return pageNumbers;
  };


  // --- 렌더링 ---
  // 로딩 및 에러 상태 표시 추가
  if (loading) {
    return <div className="stock-table loading">데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="stock-table error">오류: {error}</div>;
  }

  return (
    <div className="stock-table">
      {/* (이하 JSX 구조는 변경 없음) */}
      <div className="title">
        <h2 className="title-1">차트</h2>
        <h2 className="title-2">변동 순</h2>
      </div>

      <div className="table-container">
        {/* 차트 테이블 */}
        <div className="chart-table">
          <div style={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
              <table>
                <thead>
                  <tr>
                    <th className="rank-header"></th>
                    <th>종목</th>
                    <th>현재가</th>
                    <th>등락률</th>
                    <th className="favorite-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentChartData.map((stock, index) => (
                    <tr key={stock.name} className="stock-row">
                      <td className="rank-cell">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{stock.name}</td>
                      <td>{stock.price}</td> {/* 임시 데이터 "N/A" 표시됨 */}
                      <td className={stock.change >= 0 ? "positive" : "negative"}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}% {/* 임시 데이터 0.0% 표시됨 */}
                      </td>
                      <td className="favorite-cell">
                        <span
                          className="favorite-icon"
                          onClick={() => handleFavoriteClick(stock.name)}
                          title={`${stock.name} 찜하기`}
                        >
                          ♥
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          {/* 페이지네이션 컨트롤 */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>&lt;</button>
              {renderPageNumbers()}
              <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>&gt;</button>
            </div>
          )}
        </div>

        {/* 세로선 */}
        <div className="vertical-line"></div>

        {/* 변동순 테이블 */}
        <div className="change-rank">
          <table>
            <thead>
              <tr>
                <th>종목</th>
                <th>등락률</th>
                <th className="favorite-header"></th>
              </tr>
            </thead>
            <tbody>
              {/* 변동순 데이터는 상위 N개만 표시 (10개) */}
              {allChangeRankData.slice(0, 10).map((stock) => (
                <tr key={stock.name} className="stock-row">
                  <td>{stock.name}</td>
                  <td className={stock.change >= 0 ? "positive" : "negative"}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                  </td>
                  <td className="favorite-cell">
                    <span
                      className="favorite-icon"
                      onClick={() => handleFavoriteClick(stock.name)}
                      title={`${stock.name} 찜하기`}
                    >
                      ♥
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}