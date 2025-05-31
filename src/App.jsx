// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext'; // ✅ UserContext 임포트
import Home from './pages/Home';
import ChatBox from './pages/ChatBox';

export default function App() {
  return (
    <UserProvider> {/* ✅ 전역 사용자 상태 관리 */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chatbox" element={<ChatBox />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
