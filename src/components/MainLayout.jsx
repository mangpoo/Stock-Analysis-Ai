import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

export default function MainLayout({ children, onFavoriteClick, onRecentClick, isPanelOpen }) {
  return (
    <div className="main-layout">
      <Sidebar
        onFavoriteClick={onFavoriteClick}
        onRecentClick={onRecentClick}
      />
      <div className={`main-content-wrapper ${isPanelOpen ? 'panel-open' : ''}`}>
        <Header />
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}