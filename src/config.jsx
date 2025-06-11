// src/config.js

// 주식 데이터, 로고, 메인 API를 위한 기본 호스트 정보 (유지)
const STOCK_SERVER_HOST = "http://16.184.17.9:5000";

// 외부 서비스 (예: 크롤러, 요약)를 위한 기본 호스트 정보 (유지)
const EXTERNAL_SERVER_HOST = "http://minjun0410.iptime.org:5000";

// ⭐ Google 로그인/인증을 위한 백엔드 API 기본 URL (새로 추가)
// Flask 백엔드의 배포 주소인 http://ddolddol2.duckdns.org:5000을 사용합니다.
const AUTH_API_BASE_URL = "http://ddolddol2.duckdns.org:5000";


// API 기본 URL들을 별도 변수로 먼저 정의합니다.
const STOCK_API_BASE_URL = `${STOCK_SERVER_HOST}`;
const EXTERNAL_API_BASE_URL = `${EXTERNAL_SERVER_HOST}`;

const API_CONFIG = {
    STOCK_API_BASE_URL: STOCK_API_BASE_URL,
    EXTERNAL_API_BASE_URL: EXTERNAL_API_BASE_URL,
    CHART_IFRAME_SERVER_HOST: STOCK_SERVER_HOST, // 차트 Iframe은 주식 서버 호스트 사용

    endpoints: {
        // --- 주식 서버 엔드포인트 (기존 유지) ---
        search: (query) => `${STOCK_API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
        recommendList: (stockType) => `${STOCK_API_BASE_URL}/recommend/${stockType}`,
        stockDetails: (stockType, ticker) => `${STOCK_API_BASE_URL}/changerate/${stockType}/${ticker}`,
        getAllChanges: (stockType) => `${STOCK_API_BASE_URL}/get_ch_all/${stockType}`,
        stockLogo: (stockType, ticker) => `${STOCK_API_BASE_URL}/logo/${stockType}/${ticker || 'default'}`,
        stockData: (countryCode, ticker, fromDate, toDate) =>
            `${STOCK_API_BASE_URL}/${countryCode}/${ticker}/${fromDate}/${toDate}`,

        // --- 외부 서버 엔드포인트 (기존 유지) ---
        crawler: (ticker) => `${EXTERNAL_API_BASE_URL}/crawler/${ticker}`,
        getSummary: (newsId) => `${EXTERNAL_API_BASE_URL}/getSummary/${newsId}`,
        chatGptAnalyzeChart: `${EXTERNAL_API_BASE_URL}/chatGptAnalyzeChart`,
        chatGptConsolidatedAnalysis: `${EXTERNAL_API_BASE_URL}/chatGptConsolidatedAnalysis`,

        // ⭐ Google 로그인 및 인증 관련 엔드포인트 (새로 추가) ---
        // 로그인 및 토큰 검증은 AUTH_API_BASE_URL을 사용합니다.
        googleLoginCallback: () => `${AUTH_API_BASE_URL}/login`, // Google OAuth 코드를 백엔드로 전송할 엔드포인트
        verifyToken: () => `${AUTH_API_BASE_URL}/verify`,       // JWT 토큰 유효성 검증 엔드포인트

        // --- 차트 Iframe URL (기존 유지) ---
        chartIframe: (chartServerHost, countryCode, ticker, startDate, endDate) =>
            `${chartServerHost}/chart/${countryCode}/${ticker}/${startDate}/${endDate}`,
    },
};

export default API_CONFIG;