import React, { useState } from 'react';
import MainLayout from './MainLayout';
import './AppLayout.css';

function AppLayout({ children }) {
  // 어떤 타입의 패널이 열려있는지 관리 ('favorite', 'recent', null)
  const [panelType, setPanelType] = useState(null);

  // 특정 타입의 패널을 토글하는 함수
  const togglePanel = (type) => {
    setPanelType(currentType => (currentType === type ? null : type));
  };

  // 패널을 닫는 공통 함수 (X 버튼용)
  const closePanel = () => {
    setPanelType(null);
  };

  // 패널이 열려있는지 여부를 boolean 값으로 저장
  const isPanelOpen = panelType !== null;

  return (
    <div className="app-container">
      {/* Sidebar와 메인 컨텐츠를 포함하는 MainLayout */}
      <MainLayout
        onFavoriteClick={() => togglePanel('favorite')}
        onRecentClick={() => togglePanel('recent')}
        isPanelOpen={isPanelOpen} // 콘텐츠를 밀기 위해 패널 오픈 상태 전달
      >
        {children}
      </MainLayout>

      {/* --- 패널 영역 --- */}

      {/* 관심 종목 패널 */}
      <div className={`side-panel favorite-panel ${panelType === 'favorite' ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>관심 종목</h2>
          <button onClick={closePanel} className="close-button">X</button>
        </div>
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

      {/* 최근 본 종목 패널 */}
      <div className={`side-panel recent-panel ${panelType === 'recent' ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>최근 본 종목</h2>
          <button onClick={closePanel} className="close-button">X</button>
        </div>
        <div className="panel-content">
          <p>최근 본 종목 리스트...</p>
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