// src/config.js

// 주식 데이터, 로고, 메인 API를 위한 기본 호스트 정보
const STOCK_SERVER_HOST = "http://16.184.17.9:5000"; // 호스트 이름 및 포트

// 외부 서비스 (예: 크롤러, 요약)를 위한 기본 호스트 정보
const EXTERNAL_SERVER_HOST = "http://minjun0410.iptime.org:5000"; // 외부 서비스용 호스트 이름 및 포트

// ⭐ API 기본 URL들을 별도 변수로 먼저 정의합니다.
const STOCK_API_BASE_URL = `${STOCK_SERVER_HOST}`;
const EXTERNAL_API_BASE_URL = `${EXTERNAL_SERVER_HOST}`;

const API_CONFIG = {
    // 기본 URL들을 여기서도 정의해두면 다른 곳에서 사용하기 편합니다.
    STOCK_API_BASE_URL: STOCK_API_BASE_URL,
    EXTERNAL_API_BASE_URL: EXTERNAL_API_BASE_URL,
    CHART_IFRAME_SERVER_HOST: STOCK_SERVER_HOST,

    endpoints: {
        // --- 주식 서버 엔드포인트 ---
        search: (query) => `${STOCK_API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
        recommendList: (stockType) => `${STOCK_API_BASE_URL}/recommend/${stockType}`,
        stockDetails: (stockType, ticker) => `${STOCK_API_BASE_URL}/changerate/${stockType}/${ticker}`,
        getAllChanges: (stockType) => `${STOCK_API_BASE_URL}/get_ch_all/${stockType}`,
        stockLogo: (stockType, ticker) => `${STOCK_API_BASE_URL}/logo/${stockType}/${ticker || 'default'}`,
        stockData: (countryCode, ticker, fromDate, toDate) =>
            `${STOCK_API_BASE_URL}/${countryCode}/${ticker}/${fromDate}/${toDate}`,

        // --- 외부 서버 엔드포인트 ---
        crawler: (ticker) => `${EXTERNAL_API_BASE_URL}/crawler/${ticker}`,
        getSummary: (newsId) => `${EXTERNAL_API_BASE_URL}/getSummary/${newsId}`,
        chatGptAnalyzeChart: `${EXTERNAL_API_BASE_URL}/chatGptAnalyzeChart`,
        
        // ⭐ 통합 분석을 위한 새로운 엔드포인트를 추가합니다.
        chatGptConsolidatedAnalysis: `${EXTERNAL_API_BASE_URL}/chatGptConsolidatedAnalysis`,

        // --- 차트 Iframe URL ---
        chartIframe: (chartServerHost, countryCode, ticker, startDate, endDate) =>
            `${chartServerHost}/chart/${countryCode}/${ticker}/${startDate}/${endDate}`,
    },
};

export default API_CONFIG;