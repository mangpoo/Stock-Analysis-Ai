import React from 'react';
import './Header.css';


export default function Header() {
  return (
    <header className="header">
      <input className="search-input" placeholder="🔍 검색" />
      <button className="login-btn">로그인</button>
    </header>
  );
}
