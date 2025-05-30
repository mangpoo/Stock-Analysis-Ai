import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChatBox from './pages/ChatBox';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatbox" element={<ChatBox />} />

      </Routes>
    </BrowserRouter>
  );
}
