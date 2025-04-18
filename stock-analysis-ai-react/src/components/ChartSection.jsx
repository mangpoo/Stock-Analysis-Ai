import React from 'react';
import './ChartSection.css';

export default function ChartSection() {
  // --- 버튼 클릭 핸들러 (예시) ---
  const handleChartAnalysis = () => {
    console.log("차트 분석 버튼 클릭됨");
    // 여기에 차트 분석 로직 또는 관련 상태 업데이트 추가
  };

  const handleOtherAction = () => {
    console.log("다른 기능 버튼 클릭됨");
    // 다른 기능 관련 로직
  };
  // --------------------------------

  // --- 임시 데이터 ---
  const stockData = {
    name: "삼숭전자",
    price: "12,920원", // 가격 데이터는 문자열 또는 숫자로 관리 가능
    logoPlaceholder: "로고" // 나중에 img 태그로 대체
  };
  // ------------------

  return (
    <div className="chart-section">

      {/* ===== 종목 정보 헤더 영역 ===== */}
      <div className="chart-header-info">
        <div className="image-placeholder">{stockData.logoPlaceholder}</div>
        <div className="stock-info-text">
          <span className="stock-name">{stockData.name}</span>
          <span className="stock-price">{stockData.price}</span>
        </div>
      </div>
      {/* ============================ */}

      <div className="chart-layout-container">
        <div className="chart-iframe-container">
          <iframe
            className="chart-iframe"
            src="http://172.17.153.114:5000/chart/kr/005930/20000101/20250417"
            title="Stock Chart" // 접근성을 위한 title 속성
          ></iframe>
        </div>

        

        <div className="chart-controls">
          <h3>AI 분석</h3>
          <button onClick={handleChartAnalysis}>차트 분석</button>
          <button onClick={handleOtherAction}>다른 기능 1</button>
          <button onClick={handleOtherAction}>다른 기능 2</button>
          {/* 필요에 따라 더 많은 버튼이나 컨트롤 추가 */}
        </div>
      </div>
    </div>
  );
}