// src/api.js
import axios from 'axios';

// ✅ Flask 백엔드와 통신하는 axios 인스턴스 생성
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000', // 👉 배포 시 도메인으로 변경
  withCredentials: false,           // CORS 쿠키 안 쓸 거면 false
});

// ✅ 요청 인터셉터: JWT 토큰 자동 추가
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ✅ 응답 인터셉터: 에러 로그 등 공통 처리 (선택)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('🔐 인증이 필요한 요청입니다.');
      // 👉 로그아웃 처리나 리디렉션 등 추가 가능
      localStorage.removeItem('jwt_token');
      window.location.href = '/';  // 홈으로 이동
    }
    return Promise.reject(error);
  }
);

export default api;
