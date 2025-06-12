// src/config.js

// 주식 데이터, 로고, 메인 API를 위한 기본 호스트 정보
//const STOCK_SERVER_HOST = "http://43.202.156.210:5000";
 const STOCK_SERVER_HOST = "https://ddolddol2.duckdns.org/api";

// 외부 서비스 (예: 크롤러, 요약, 차트 분석, 통합 분석)를 위한 기본 호스트 정보
// 플라스크 .env의 CRAWLER_SERVER_HOST와 동일한 주소입니다.
// const EXTERNAL_SERVER_HOST = "http://minjun0410.iptime.org:5000";
const EXTERNAL_SERVER_HOST = "https://ddolddol2.duckdns.org/ai";

// Google 로그인/인증을 위한 백엔드 API 기본 URL
// Flask 백엔드의 배포 주소인 http://ddolddol2.duckdns.org:5000을 사용합니다.
const AUTH_API_BASE_URL = "https://ddolddol2.duckdns.org"; // 이 주소는 현재 백엔드(app.py)가 실행되는 주소여야 합니다.

// API 기본 URL들을 별도 변수로 먼저 정의합니다.
const STOCK_API_BASE_URL = `${STOCK_SERVER_HOST}`;
const EXTERNAL_API_BASE_URL = `${EXTERNAL_SERVER_HOST}`;
// 백엔드 API의 호스트를 명확히 정의합니다.
// 이 주소는 app.py가 실행되는 서버의 IP와 포트(5001)를 사용해야 합니다.
// const BACKEND_API_HOST = "http://127.0.0.1:5001"; // 또는 app.py의 실행 주소 (예: http://your-backend-ip:5001)
const BACKEND_API_HOST = "https://ddolddol2.duckdns.org";

const API_CONFIG = {
    STOCK_API_BASE_URL: STOCK_API_BASE_URL,
    EXTERNAL_API_BASE_URL: EXTERNAL_API_BASE_URL,
    CHART_IFRAME_SERVER_HOST: STOCK_SERVER_HOST, // 차트 Iframe은 주식 서버 호스트 사용

    endpoints: {
        // --- 주식 서버 엔드포인트 ---
        search: (query) => `${STOCK_API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
        recommendList: (stockType) => `${STOCK_API_BASE_URL}/recommend/${stockType}`,
        stockDetails: (stockType, ticker) => `${STOCK_API_BASE_URL}/changerate/${stockType}/${ticker}`,
        getAllChanges: (stockType) => `${STOCK_API_BASE_URL}/get_ch_all/${stockType}`,
        stockLogo: (stockType, ticker) => `${STOCK_API_BASE_URL}/logo/${stockType}/${ticker || 'default'}`,
        // **MODIFICATION START**
        getKrName: (ticker) => `${STOCK_API_BASE_URL}/get_kr_name/${ticker}`, // 미국 종목 한글 이름 조회
        // **MODIFICATION END**
        // NOTE: 이 stockData 엔드포인트는 chartGptAnalyzeChart에서 더 이상 직접 사용되지 않습니다.
        // 백엔드의 get_stock_history 함수가 이 역할을 대체합니다.
        stockData: (countryCode, ticker, fromDate, toDate) =>
            `${STOCK_API_BASE_URL}/${countryCode}/${ticker}/${fromDate}/${toDate}`,

        // --- 외부 서버 엔드포인트 (크롤링, 요약) ---
        // **MODIFICATION START**
        // 백엔드의 크롤러는 이제 종목 티커 대신 이름을 받습니다.
        crawler: (name) => `${EXTERNAL_API_BASE_URL}/crawler/${encodeURIComponent(name)}`,
        // **MODIFICATION END**
        // getSummary는 현재 백엔드 app.py에서 개별 뉴스 URL을 호출하는 방식으로 변경된 듯합니다.
        // 프론트엔드에서 직접 호출할 필요가 없으므로 이 부분은 필요에 따라 제거하거나 백엔드의 뉴스 요약 API로 변경해야 합니다.
        // 여기서는 사용되지 않는 것으로 가정합니다.
        getSummary: (newsId) => `${EXTERNAL_API_BASE_URL}/getSummary/${newsId}`,

        // --- GPT 분석 엔드포인트 (Flask 백엔드 app.py에 정의된 API 사용) ---
        // 차트 분석 (주가 데이터만 사용하는 분석)
        // 백엔드 app.py의 @app.route('/api/analyze-price/<string:country>/<string:ticker>')
        chatGptAnalyzeChart: (country, ticker) => `${BACKEND_API_HOST}/api/analyze-price/${country}/${ticker}`,
        
        // 통합 분석 (주가 데이터 + 뉴스 데이터를 사용하는 분석)
        // 백엔드 app.py의 @app.route('/api/analyze/<string:country>/<string:ticker>')
        chatGptConsolidatedAnalysis: (country, ticker) => `${BACKEND_API_HOST}/api/analyze/${country}/${ticker}`,

        // --- Google 로그인 및 인증 관련 엔드포인트 ---
        googleLoginCallback: () => `${AUTH_API_BASE_URL}/login`,
        verifyToken: () => `${AUTH_API_BASE_URL}/verify`,  

        // --- 차트 Iframe URL ---
        chartIframe: (chartServerHost, countryCode, ticker, startDate, endDate) =>
            `${chartServerHost}/chart/${countryCode}/${ticker}/${startDate}/${endDate}`,
    },
};

export default API_CONFIG;