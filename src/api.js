// src/api.js
import axios from 'axios';
import API_CONFIG from './config'; // config.js에서 baseURL을 가져오기 위해 import

// ✅ 주식 관련 API를 위한 axios 인스턴스 (STOCK_SERVER_HOST)
const stockApi = axios.create({
    baseURL: API_CONFIG.STOCK_API_BASE_URL,
    withCredentials: false,
});

// ✅ 인증 관련 API를 위한 axios 인스턴스 (AUTH_API_BASE_URL)
const authApi = axios.create({
    baseURL: API_CONFIG.AUTH_API_BASE_URL,
    withCredentials: false,
});

// --- 요청 인터셉터: JWT 토큰 자동 추가 (두 인스턴스 모두에 적용) ---
const addAuthTokenInterceptor = config => {
    const token = localStorage.getItem('accessToken'); // Header.jsx에서 'accessToken' 키 사용
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

stockApi.interceptors.request.use(addAuthTokenInterceptor, error => Promise.reject(error));
authApi.interceptors.request.use(addAuthTokenInterceptor, error => Promise.reject(error));

// --- 응답 인터셉터: 에러 로그 및 401 Unauthorized 처리 (두 인스턴스 모두에 적용) ---
const handleResponseErrorInterceptor = error => {
    if (error.response?.status === 401) {
        console.warn('🔐 인증이 필요한 요청입니다. 토큰이 만료되었거나 유효하지 않습니다.');
        localStorage.removeItem('accessToken');
        window.location.href = '/'; // 홈으로 이동하여 로그인 상태 초기화
    }
    return Promise.reject(error);
};

stockApi.interceptors.response.use(response => response, handleResponseErrorInterceptor);
authApi.interceptors.response.use(response => response, handleResponseErrorInterceptor);

// 두 개의 axios 인스턴스를 내보냅니다.
export { stockApi, authApi };