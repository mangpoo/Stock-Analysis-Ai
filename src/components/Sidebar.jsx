import React from 'react';
import { HeartIcon, ClockIcon } from '@heroicons/react/24/solid';
import logo from './img/logo.png'; // 로고 이미지가 있다면 사용
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ onFavoriteClick, onRecentClick }) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="로고" className="logo-img" />
      </div>

      <div
        className="icon-text"
        onClick={onFavoriteClick}
        style={{ cursor: 'pointer' }}
      >
        <HeartIcon className="icon" />
        <span className="icon-label">관심</span>
      </div>

      <div
        className="icon-text"
        onClick={onRecentClick}
        style={{ cursor: 'pointer' }}
      >
        <ClockIcon className="icon" />
        <span className="icon-label">최근 본</span>
      </div>
    </aside>
  );
}