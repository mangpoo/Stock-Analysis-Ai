import React from 'react';
import { HeartIcon, ClockIcon } from '@heroicons/react/24/solid';
import logo from './img/logo.png';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ onFavoriteClick, onRecentClick }) {
  // Sidebar가 렌더링될 때 받은 props 값 확인
  console.log('Sidebar 렌더링 시 받은 props:', { onFavoriteClick, onRecentClick });
  console.log(' - onFavoriteClick 타입:', typeof onFavoriteClick);
  console.log(' - onRecentClick 타입:', typeof onRecentClick);

  const navigate = useNavigate();

  const handleFavoriteWrapperClick = () => {
    console.log('--- [Sidebar] 관심 아이콘 영역 클릭됨 ---'); // 1. 클릭 자체 확인
    console.log('   클릭 시점 onFavoriteClick 타입:', typeof onFavoriteClick); // 2. 클릭 시점의 prop 타입 확인
    if (typeof onFavoriteClick === 'function') {
      console.log('   onFavoriteClick 함수 호출 시도...'); // 3. 호출 직전 로그
      onFavoriteClick(); // 함수 호출
    } else {
      console.error('   오류: onFavoriteClick prop이 함수가 아닙니다!', onFavoriteClick); // 함수 아닐 시 에러 로그
    }
  };

  const handleRecentWrapperClick = () => {
    console.log('--- [Sidebar] 최근 본 아이콘 영역 클릭됨 ---'); // 1. 클릭 자체 확인
    console.log('   클릭 시점 onRecentClick 타입:', typeof onRecentClick); // 2. 클릭 시점의 prop 타입 확인
    if (typeof onRecentClick === 'function') {
      console.log('   onRecentClick 함수 호출 시도...'); // 3. 호출 직전 로그
      onRecentClick(); // 함수 호출
    } else {
      console.error('   오류: onRecentClick prop이 함수가 아닙니다!', onRecentClick); // 함수 아닐 시 에러 로그
    }
  };


  const handleLogoClick = () => {
    console.log('--- [Sidebar] 로고 클릭됨 - 홈으로 이동 ---');
    navigate('/'); 
  };
  return (
    <aside className="sidebar">
      <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}> {/* Added onClick and cursor style */}
        <img src={logo} alt="로고" className="logo-img" />
        <span className="web-name"></span> {/* Add a name here if needed */}
      </div>

      {/* '관심' 영역 */}
      <div
        className="icon-text"
        // onClick={onFavoriteClick} // 직접 호출 대신 래퍼 함수 사용
        onClick={handleFavoriteWrapperClick}
        style={{ cursor: 'pointer' }}
      >
        <HeartIcon className="icon" />
        <span className="icon-label">관심</span>
      </div>

      {/* '최근 본' 영역 */}
      <div
        className="icon-text"
        // onClick={onRecentClick} // 직접 호출 대신 래퍼 함수 사용
        onClick={handleRecentWrapperClick}
        style={{ cursor: 'pointer' }}
      >
        <ClockIcon className="icon" />
        <span className="icon-label">최근 본</span>
      </div>
    </aside>
  );
}