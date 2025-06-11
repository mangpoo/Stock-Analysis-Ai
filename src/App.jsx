import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './pages/Home';
import AppLayout from './components/AppLayout'; // AppLayout을 최상위에서 사용
import ChartPage from './pages/Chart';
import { UserProvider } from './contexts/UserContext'; // UserProvider 임포트

function App() {
  return (
    <UserProvider>
      <Router>
        <AppLayout> {/* AppLayout이 모든 페이지를 감싸도록 설정 */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chart/:ticker" element={<ChartPage />} />
            {/* 필요한 경우 회원가입 페이지를 위한 예시 라우트 */}
            {/* <Route path="/signup" element={<SignupPage />} /> */}
          </Routes>
        </AppLayout>
      </Router>
    </UserProvider>
  );
}

export default App;