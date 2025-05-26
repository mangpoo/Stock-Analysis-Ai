// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChartPage from './pages/Chart'; // ChartPage로 명확히 하거나 Chart 그대로 사용

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Chart 페이지 라우트를 /chart/:ticker 형태로 수정 */}
        <Route path="/chart/:ticker" element={<ChartPage />} />
        {/* 기존 /chart 라우트가 필요하다면 별도로 정의하거나, 리다이렉션 처리 */}
        {/* <Route path="/chart" element={<ChartPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}