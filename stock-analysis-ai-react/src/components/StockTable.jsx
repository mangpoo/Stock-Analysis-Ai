import React, { useState, useEffect } from "react";
import "./StockTable.css";
// import { FaRegHeart, FaHeart } from 'react-icons/fa'; // react-icons 사용 예시

export default function StockTable() {
  // --- 상태 관리 ---
  const [currentPage, setCurrentPage] = useState(1);
  const [allChartData, setAllChartData] = useState([]);
  const [allChangeRankData, setAllChangeRankData] = useState([]);

  // --- 상수 ---
  const ITEMS_PER_PAGE = 11; // 페이지당 표시할 항목 수를 11개로 변경

  // --- 데이터 로딩 시뮬레이션 ---
  useEffect(() => {
    // 예시: 전체 차트 데이터 (40개) - isFavorite 속성 제거
    const fetchedChartData = [
        { name: "HLB", price: "66,400원", change: -7.6 },
        { name: "삼성전자", price: "60,200원", change: 2.9 },
        { name: "SK하이닉스", price: "150,000원", change: 1.5 },
        { name: "LG화학", price: "450,000원", change: -0.5 },
        { name: "현대차", price: "200,000원", change: 0.8 },
        { name: "기아", price: "85,000원", change: -1.1 },
        { name: "POSCO홀딩스", price: "400,000원", change: 0.3 },
        { name: "셀트리온", price: "180,000원", change: 2.1 },
        { name: "KB금융", price: "60,000원", change: -0.2 },
        { name: "신한지주", price: "40,000원", change: 0.1 },
        { name: "카카오", price: "55,000원", change: -3.5 }, // 11번째 항목
        // --- 페이지 2 데이터 ---
        { name: "네이버", price: "210,000원", change: 4.2 },
        { name: "LG에너지솔루션", price: "380,000원", change: -1.8 },
        { name: "카카오페이", price: "48,000원", change: 5.5 },
        { name: "두산에너빌리티", price: "17,000원", change: -2.0 },
        { name: "하이브", price: "250,000원", change: 3.1 },
        { name: "크래프톤", price: "230,000원", change: -1.5 },
        { name: "SK이노베이션", price: "120,000원", change: 1.0 },
        { name: "삼성SDI", price: "420,000원", change: -0.8 },
        { name: "고려아연", price: "500,000원", change: 2.5 },
        { name: "삼성물산", price: "140,000원", change: 0.7 },
        { name: "LG전자", price: "100,000원", change: -0.4 }, // 22번째 항목
        // --- 페이지 3 데이터 ---
        { name: "KT&G", price: "90,000원", change: 1.2 },
        { name: "SK텔레콤", price: "50,000원", change: -0.1 },
        { name: "한국전력", price: "25,000원", change: 0.9 },
        { name: "포스코퓨처엠", price: "300,000원", change: -2.2 },
        { name: "HMM", price: "18,000원", change: 3.3 },
        { name: "에코프로비엠", price: "260,000원", change: -1.3 },
        { name: "엔씨소프트", price: "220,000원", change: 0.5 },
        { name: "삼성생명", price: "75,000원", change: -0.7 },
        { name: "아모레퍼시픽", price: "150,000원", change: 1.8 },
        { name: "넷마블", price: "60,000원", change: -1.0 },
        { name: "LG디스플레이", price: "15,000원", change: 2.0 }, // 33번째 항목
        // --- 페이지 4 데이터 ---
        { name: "SK바이오사이언스", price: "70,000원", change: -0.9 },
        { name: "대한항공", price: "28,000원", change: 1.1 },
        { name: "현대모비스", price: "230,000원", change: -0.3 },
        { name: "삼성화재", price: "280,000원", change: 0.6 },
        { name: "LG생활건강", price: "400,000원", change: -1.2 },
        { name: "두산밥캣", price: "55,000원", change: 2.8 },
        { name: "SK스퀘어", price: "45,000원", change: -0.6 }, // 40번째 항목
    ];
    setAllChartData(fetchedChartData);

    // 예시: 변동순 데이터 (isFavorite 속성 제거)
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

  }, []);

  // --- 계산된 값 ---
  const totalPages = Math.ceil(allChartData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentChartData = allChartData.slice(startIndex, endIndex);

  // --- 이벤트 핸들러 ---
  // 찜 클릭 핸들러 (콘솔 로그만 출력)
  const handleFavoriteClick = (stockName) => {
    console.log(`${stockName} 찜 상태 변경됨`);
    // 실제 찜 상태 관리 로직은 여기에 추가하지 않음
  };

  // 페이지 변경 핸들러
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

  // 페이지네이션 버튼 렌더링 로직 (변경 없음)
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
  return (
    <div className="stock-table">
      <div className="title">
        {/* 페이지 정보 텍스트 제거 */}
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
                     <td>{stock.price}</td>
                     <td className={stock.change >= 0 ? "positive" : "negative"}>
                       {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                     </td>
                     <td className="favorite-cell">
                       <span
                         // active 클래스 로직 제거
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
              {/* 변동순 데이터는 상위 N개만 표시 (11개) */}
              {allChangeRankData.slice(0, 11).map((stock) => (
                <tr key={stock.name} className="stock-row">
                  <td>{stock.name}</td>
                  <td className={stock.change >= 0 ? "positive" : "negative"}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                  </td>
                  <td className="favorite-cell">
                    <span
                      // active 클래스 로직 제거
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