import React, { useState } from 'react';
import Sidebar from './Sidebar'; // Sidebar 컴포넌트 임포트
import './AppLayout.css'; // 레이아웃 및 패널 CSS

function AppLayout() {
  // 어떤 타입의 패널이 열려있는지 관리 ('favorite', 'recent', null)
  const [panelType, setPanelType] = useState(null);

  // 특정 타입의 패널을 토글하는 함수
  const togglePanel = (type) => {
    // 현재 열려있는 패널과 같은 타입의 버튼을 누르면 닫고 (null)
    // 다른 타입이거나 닫혀있으면 해당 타입으로 설정
    setPanelType(currentType => (currentType === type ? null : type));
  };

  // 패널을 닫는 공통 함수 (X 버튼용)
  const closePanel = () => {
    setPanelType(null);
  };

  return (
    <div className="app-container"> {/* 전체 앱 컨테이너 */}
      {/* Sidebar에 토글 함수 전달 */}
      <Sidebar
        onFavoriteClick={() => togglePanel('favorite')} // 'favorite' 타입 토글
        onRecentClick={() => togglePanel('recent')}   // 'recent' 타입 토글
      />

      <main className="main-content">
        {/* 여기에 기존의 메인 화면 컨텐츠가 들어갑니다 */}
        <h1>메인 컨텐츠 영역</h1>
        <p>페이지의 나머지 내용...</p>
      </main>

      {/* 관심 종목 패널 */}
      {/* panelType 상태가 'favorite'일 때 'open' 클래스 추가 */}
      <div className={`side-panel favorite-panel ${panelType === 'favorite' ? 'open' : ''}`}>
        {/* 패널 헤더 */}
        <div className="panel-header">
          <h2>관심 종목</h2>
          {/* X 버튼은 항상 패널을 닫도록 closePanel 함수 사용 */}
          <button onClick={closePanel} className="close-button">X</button>
        </div>
        {/* 패널 컨텐츠 */}
        <div className="panel-content">
          <p>관심 그룹에 담아보세요</p>
          <ul>
            <li>펨트론 164,600원 (+37,900원 29.9%)</li>
            <li>현대차 177,000원 (-10,000원 5.3%)</li>
            <li>신성이엔지 1,263원 (+103원 8.8%)</li>
          </ul>
          <button className="add-button">+ 추가하기</button>
        </div>
      </div>

      {/* 최근 본 종목 패널 (주석 해제 및 수정) */}
      {/* panelType 상태가 'recent'일 때 'open' 클래스 추가 */}
      <div className={`side-panel recent-panel ${panelType === 'recent' ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>최근 본 종목</h2>
          {/* X 버튼은 항상 패널을 닫도록 closePanel 함수 사용 */}
          <button onClick={closePanel} className="close-button">X</button>
        </div>
        <div className="panel-content">
          <p>최근 본 종목 리스트...</p>
          {/* 여기에 최근 본 종목 내용을 채웁니다 */}
          <ul>
             <li>최근 본 종목 1</li>
             <li>최근 본 종목 2</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;