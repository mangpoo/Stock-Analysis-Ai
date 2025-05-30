import React from 'react';
import { HomeIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/solid';
import logo from './img/logo.png'; 

import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={logo} alt="로고" className="logo-img" />
        <span className="web-name"></span>
      </div>
      {/*
      <div className="icon-text">
        <HomeIcon className="icon" />
        <span className="icon-label">홈</span>
      </div>
      */}
      <div className="icon-text">
        <HeartIcon className="icon" />
        <span className="icon-label">관심</span>
      </div>
      <div className="icon-text">
        <ClockIcon className="icon" />
        <span className="icon-label">최근 본</span>
      </div>
    </aside>
  );
}
