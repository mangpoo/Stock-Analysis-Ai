// src/config.jsx

// 주식 데이터, 로고, 메인 API를 위한 기본 호스트 정보
const STOCK_SERVER_HOST = "16.184.21.78:5000"; // 호스트 이름 및 포트

// 외부 서비스 (예: minjun0410.iptime.org)를 위한 기본 호스트 정보 (필요한 경우)
const EXTERNAL_SERVER_HOST = "minjun0410.iptime.org:5000"; // 외부 서비스용 호스트 이름 및 포트

const API_CONFIG = {
    // 주식 서버의 /api 경로를 사용하는 API들을 위한 기본 URL
    STOCK_API_BASE_URL: `http://${STOCK_SERVER_HOST}`,

    // 차트 iframe을 위한 호스트 (chartIframe 엔드포인트 함수에서 사용)
    // 차트 iframe 경로는 /api를 포함하지 않으므로 호스트:포트 정보만 사용합니다.
    CHART_IFRAME_SERVER_HOST: STOCK_SERVER_HOST,

    // 외부 API (예: 크롤러, 요약)를 위한 기본 URL
    EXTERNAL_API_BASE_URL: `http://${EXTERNAL_SERVER_HOST}`,

    endpoints: {
        // --- 주식 서버 엔드포인트 (STOCK_API_BASE_URL 사용) ---
        search: (query) => `${API_CONFIG.STOCK_API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
        recommendList: (stockType) => `${API_CONFIG.STOCK_API_BASE_URL}/recommend/${stockType}`,
        stockDetails: (stockType, ticker) => `${API_CONFIG.STOCK_API_BASE_URL}/changerate/${stockType}/${ticker}`,
        stockLogo: (stockType, ticker) => `${API_CONFIG.STOCK_API_BASE_URL}/logo/${stockType}/${ticker || 'default'}`, // ticker가 없을 경우 'default' 사용

        // --- 외부 서버 엔드포인트 (EXTERNAL_API_BASE_URL 사용) ---
        // 기존 구조에 따라 크롤러 및 요약 API는 외부 서버를 사용하는 것으로 가정
        crawler: (ticker) => `${API_CONFIG.EXTERNAL_API_BASE_URL}/crawler/${ticker}`,
        getSummary: (newsId) => `${API_CONFIG.EXTERNAL_API_BASE_URL}/getSummary/${newsId}`,

        // --- 차트 Iframe URL ---
        // 차트 iframe을 위한 전체 URL을 생성합니다.
        // chartServerHost 파라미터에는 API_CONFIG.CHART_IFRAME_SERVER_HOST가 전달됩니다.
        chartIframe: (chartServerHost, countryCode, ticker, startDate, endDate) =>
            `http://${chartServerHost}/chart/${countryCode}/${ticker}/${startDate}/${endDate}`,
    },
};

export default API_CONFIG;