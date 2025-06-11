import React, { useState } from 'react';
import './ChartSection.css';
import ChartModal from './ChartModal';
import API_CONFIG from '../config'; // 제공해주신 config.js를 import

export default function ChartSection({ ticker, stockName, stockPrice, stockChange, logoUrl, chartServerIp, stockCountryCode }) {
    const [summaries, setSummaries] = useState([]);
    const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    // 차트 분석 모달 상태
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [chartAnalysisResult, setChartAnalysisResult] = useState(null);
    const [isLoadingChartAnalysis, setIsLoadingChartAnalysis] = useState(false);
    const [chartAnalysisError, setChartAnalysisError] = useState(null);

    // 통합 분석 모달 상태 관리
    const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(false);
    const [consolidatedAnalysisResult, setConsolidatedAnalysisResult] = useState(null);
    const [isLoadingConsolidatedAnalysis, setIsLoadingConsolidatedAnalysis] = useState(false);
    const [consolidatedAnalysisError, setConsolidatedAnalysisError] = useState(null);

    // --- 차트 분석 핸들러 (백엔드 /api/analyze-price 사용) ---
    const handleChartAnalysis = async () => {
        if (!ticker || !stockCountryCode) {
            setChartAnalysisError("종목 코드 또는 국가 정보가 없습니다. 차트 분석을 할 수 없습니다.");
            return;
        }

        setIsChartModalOpen(true);
        setIsLoadingChartAnalysis(true);
        setChartAnalysisResult(null);
        setChartAnalysisError(null);

        console.log(`차트 분석 요청 시작: ${stockCountryCode}/${ticker}`);

        try {
            // 백엔드의 주가 분석 API 호출
            const analysisUrl = API_CONFIG.endpoints.chatGptAnalyzeChart(stockCountryCode, ticker);
            console.log(`백엔드 주가 분석 API 요청 URL: ${analysisUrl}`);

            const response = await fetch(analysisUrl);

            if (!response.ok) {
                const errorData = await response.json(); // 백엔드에서 JSON 에러 응답을 기대
                throw new Error(`주가 분석 실패: ${response.status} - ${errorData.analysis || '알 수 없는 오류'}`);
            }

            const resultData = await response.json();
            // 백엔드에서 'analysis' 필드에 분석 결과 텍스트가 담겨 있다고 가정
            setChartAnalysisResult(resultData.analysis || "분석 결과를 가져오지 못했습니다.");
            console.log("백엔드 주가 분석 결과:", resultData);

        } catch (error) {
            console.error("차트 분석 처리 중 오류:", error);
            setChartAnalysisError(error.message);
        } finally {
            setIsLoadingChartAnalysis(false);
        }
    };

    // --- 뉴스 요약 핸들러 (기존 로직 유지, 백엔드 SDS 서버 호출) ---
    const handleNewsSummary = async () => {
        if (!ticker) {
            setSummaryError("종목 코드가 없습니다.");
            return;
        }
        if (isLoadingSummaries) return;

        console.log(`뉴스 요약 요청 시작: ${ticker} (국가: ${stockCountryCode})`);
        setIsLoadingSummaries(true);
        setSummaryError(null);
        setSummaries([]);

        try {
            // 백엔드 app.py의 get_news_data 함수가 내부적으로 호출하는 크롤러 API를 프론트에서 직접 호출
            // **주의:** app.py의 get_news_data 함수는 이미 뉴스 요약까지 백엔드에서 처리하고 있습니다.
            // 따라서 이 handleNewsSummary 함수는 더 이상 필요 없을 수 있습니다.
            // 통합 분석 시 백엔드의 `/api/analyze`가 모든 것을 처리하므로,
            // 별도로 뉴스를 가져와서 `summaries` 상태에 저장할 필요가 없을 수 있습니다.
            // 여기서는 기존 코드를 유지하되, 이 부분의 용도를 재고해볼 필요가 있음을 명시합니다.
            // 만약 뉴스 요약을 별도로 프론트엔드에 표시해야 한다면 이 로직을 사용하지만,
            // 통합 분석의 데이터로만 사용된다면 백엔드에 맡기는 것이 더 효율적입니다.

            // 현재 app.py의 get_news_data가 SDS_SERVER_IP를 통해 뉴스를 가져오고 있으므로,
            // 프론트엔드에서 직접 이 API_CONFIG.endpoints.crawler(ticker)를 호출하는 것은 중복일 수 있습니다.
            // 통합 분석을 위해서는 백엔드 /api/analyze가 뉴스 크롤링까지 내부적으로 담당하게 됩니다.

            // 이 부분은 필요에 따라 제거하거나, 만약 별도의 뉴스 요약 기능이 필요하다면
            // 백엔드에서 뉴스 요약만 제공하는 API를 만들고 그 API를 호출하도록 변경해야 합니다.
            // 현재 코드에서는 이 부분이 통합 분석과 직접적으로 연동되지는 않습니다 (별개 실행 버튼).
            
            // 임시로 news data가 app.py의 get_news_data에서 오는 것으로 가정하고 API_CONFIG를 사용하지 않고
            // app.py의 뉴스 요약 기능을 직접 호출하는 것은 불가능하므로,
            // 이 뉴스 요약 버튼의 목적이 'get_news_data'와 동일한 결과물을 프론트엔드에 보여주는 것이라면
            // app.py에 뉴스 요약만 담당하는 새로운 엔드포인트 (예: /api/news-summary/<ticker>)를 만들고 그것을 호출해야 합니다.
            // 현재 구조에서는 /api/analyze가 뉴스를 가져오므로, 이 `handleNewsSummary`는 비활성화하거나 수정해야 합니다.

            // 여기서는 기존 `handleNewsSummary`의 로직을 그대로 두지만,
            // 실제 배포 시에는 통합 분석이 모든 데이터를 포함하므로 이 기능의 필요성을 재검토해야 합니다.
            
            // 예시: 만약 백엔드에서 뉴스 요약만 가져오는 API가 있다면:
            // const newsSummaryApiUrl = `${API_CONFIG.BACKEND_API_HOST}/api/news-summary/${ticker}`;
            // const newsResponse = await fetch(newsSummaryApiUrl);
            // if (!newsResponse.ok) { ... }
            // const newsData = await newsResponse.json();
            // setSummaries(newsData.summaries); // 백엔드에서 요약된 뉴스 목록을 반환한다고 가정
            
            // 현재 코드로 뉴스 크롤러를 직접 호출하는 로직 (기존):
            const crawlerResponse = await fetch(API_CONFIG.endpoints.crawler(ticker));
            if (!crawlerResponse.ok) {
                const errorData = await crawlerResponse.text();
                throw new Error(`뉴스 목록을 가져오는데 실패했습니다: ${crawlerResponse.status} ${crawlerResponse.statusText} - ${errorData}`);
            }

            const newsIdPathsObject = await crawlerResponse.json();
            const actualNewsIdPaths = newsIdPathsObject.success || []; // 'success' 필드를 직접 참조

            if (actualNewsIdPaths.length === 0) {
                console.log("요약할 뉴스가 없습니다.");
                setSummaries([{ type: 'no_news', message: '요약할 뉴스가 없습니다.' }]);
                setIsLoadingSummaries(false);
                return;
            }

            console.log("가져온 뉴스 경로 목록 (처리 대상):", actualNewsIdPaths);

            const summaryPromises = actualNewsIdPaths.slice(0, 5).map(pathString => { // app.py가 5개만 가져오므로 프론트도 5개로 제한
                if (typeof pathString !== 'string') {
                    console.warn("경로 목록에 문자열이 아닌 요소가 포함되어 있습니다:", pathString);
                    return Promise.resolve(null);
                }
                // pathString이 이미 완전한 URL이라고 가정합니다 (SDS_SERVER_IP/news/summary/<news_id> 형태)
                // app.py의 get_news_data 함수는 이미 complete URL을 반환하므로,
                // 여기서 다시 newsId를 추출하여 `getSummary`를 호출하는 방식은 app.py와 불일치합니다.
                // app.py의 get_news_data는 이미 요약된 뉴스 객체를 반환합니다.
                // 따라서 이 `handleNewsSummary`는 app.py의 `/crawler/{ticker}` 엔드포인트가
                // 요약된 뉴스 객체를 직접 반환한다고 가정하고 수정해야 합니다.
                // 하지만 현재 app.py의 get_news_data는 뉴스 URL 리스트를 먼저 반환하고,
                // 이후 각 URL에 요청해서 요약을 가져오는 방식입니다.
                // 이 프론트엔드의 `handleNewsSummary`도 동일한 방식으로 동작해야 합니다.

                // app.py의 get_news_data와 동일하게 동작하도록 수정 (뉴스 URL을 받아서 요약 요청)
                return fetch(pathString, { timeout: 20000 }) // app.py와 동일하게 timeout 설정 (없으면 추가)
                    .then(res => {
                        if (!res.ok) {
                            console.error(`뉴스 요약 요청 실패 (${pathString}): ${res.status} ${res.statusText}`);
                            return Promise.reject(new Error(`뉴스 요약 요청 실패 (${pathString})`));
                        }
                        return res.json();
                    })
                    .then(data => ({
                        title: data.title || '제목 없음',
                        issue: data.issue || '주요 이슈 정보 없음', // 'summary' 대신 'issue' 사용
                        impact: data.impact || '시장 영향 정보 없음', // 'impact' 필드 추가
                        date: data.date || '날짜 없음',
                        link: data.link || pathString // API 응답에 link가 있으므로 그것을 우선 사용
                    }))
                    .catch(err => {
                        console.error(`뉴스 요약 처리 중 오류 [${pathString}]:`, err);
                        return null;
                    });
            });

            const fetchedSummaries = (await Promise.allSettled(summaryPromises))
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);

            if (fetchedSummaries.length === 0 && actualNewsIdPaths.length > 0) {
                setSummaries([{ type: 'empty_summary', message: '뉴스 요약 정보를 가져왔으나 내용이 없습니다.' }]);
            } else {
                setSummaries(fetchedSummaries);
            }

            console.log("최종적으로 가져온 뉴스 요약:", fetchedSummaries);

        } catch (error) {
            console.error("뉴스 요약 처리 중 최상위 오류:", error);
            setSummaryError(error.message);
        } finally {
            setIsLoadingSummaries(false);
        }
    };

    // --- 통합 분석 핸들러 (백엔드 /api/analyze 사용) ---
    const handleConsolidatedAnalysis = async () => {
        setIsConsolidatedModalOpen(true);
        setConsolidatedAnalysisResult(null);
        setConsolidatedAnalysisError(null);

        // 통합 분석은 백엔드에서 주가와 뉴스를 모두 가져오므로,
        // 프론트엔드에서 차트 분석이나 뉴스 요약이 미리 실행될 필요는 없습니다.
        // 다만, 사용자가 혼동하지 않도록 UI 상으로는 버튼 활성화/비활성화를 통해
        // 차트/뉴스 분석을 먼저 수행하도록 유도할 수는 있습니다.
        // 하지만 실제 API 호출 로직에서는 의존성을 제거합니다.
        
        if (!ticker || !stockCountryCode) {
            setConsolidatedAnalysisError("종목 코드 또는 국가 정보가 없습니다. 통합 분석을 할 수 없습니다.");
            return;
        }

        setIsLoadingConsolidatedAnalysis(true);

        try {
            // 백엔드의 통합 분석 API 호출
            const analysisUrl = API_CONFIG.endpoints.chatGptConsolidatedAnalysis(stockCountryCode, ticker);
            console.log(`백엔드 통합 분석 API 요청 URL: ${analysisUrl}`);

            const response = await fetch(analysisUrl);

            if (!response.ok) {
                const errorData = await response.json(); // 백엔드에서 JSON 에러 응답을 기대
                throw new Error(`통합 분석 실패: ${response.status} - ${errorData.analysis || '알 수 없는 오류'}`);
            }

            const resultData = await response.json();
            // 백엔드에서 'analysis' 필드에 분석 결과 텍스트가 담겨 있다고 가정
            setConsolidatedAnalysisResult(resultData.analysis || "분석 결과를 가져오지 못했습니다.");
            console.log("백엔드 통합 분석 결과:", resultData);

        } catch (error) {
            console.error("통합 분석 처리 중 오류:", error);
            setConsolidatedAnalysisError(error.message);
        } finally {
            setIsLoadingConsolidatedAnalysis(false);
        }
    };

    const startDate = "20000101";
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const endDate = `${year}${month}${day}`;

    const countryForChart = (stockCountryCode === 'us' || stockCountryCode === 'kr') ? stockCountryCode : 'kr';
    const chartIframeSrc = API_CONFIG.endpoints.chartIframe(API_CONFIG.CHART_IFRAME_SERVER_HOST, countryForChart, ticker, startDate, endDate);

    if (!ticker) {
        return (
            <div className="chart-section">
                <p>종목 정보를 불러올 수 없습니다. 목록에서 종목을 선택해주세요.</p>
            </div>
        );
    }

    const changeClassName = stockChange !== null && stockChange >= 0 ? "positive" : "negative";
    const changeText = stockChange !== null
        ? `${stockChange >= 0 ? '+' : ''}${stockChange.toFixed(1)}%`
        : 'N/A';

    return (
        <div className="chart-section">
            <div className="chart-header-info">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={`${stockName || '종목'} 로고`}
                        className="image-placeholder"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="image-placeholder">로고</div>
                )}
                <div className="stock-info-text">
                    <span className="stock-name">{stockName || ticker}</span>
                    <div className="stock-price-details">
                        <span className="stock-price">{stockPrice}</span>
                        {typeof stockChange === 'number' && (
                            <span className={`stock-change ${changeClassName}`} style={{ marginLeft: '8px' }}>
                                {changeText}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="chart-layout-container">
                <div className="chart-iframe-container">
                    <iframe
                        key={`${countryForChart}-${ticker}-${endDate}`}
                        className="chart-iframe"
                        src={chartIframeSrc}
                        title={`${stockName || ticker} Stock Chart (${countryForChart.toUpperCase()})`}
                    ></iframe>
                </div>
                <div className="chart-controls">
                    <h3>AI 분석</h3>

                    {/* 차트 분석 버튼 */}
                    <div className="ai-analysis-card" onClick={handleChartAnalysis}>
                        <div className="ai-card-icon">📊</div>
                        <div className="ai-card-content">
                            <h4 className="ai-card-title">차트 분석</h4>
                            <p className="ai-card-description">주요 차트 패턴과 기술적 지표를 분석하여 매매 전략 수립에 도움을 드립니다.</p>
                        </div>
                    </div>

                    {/* 뉴스 요약 버튼 */}
                    {/* NOTE: 이 뉴스 요약 버튼의 역할에 대해 재고해볼 필요가 있습니다.
                                백엔드의 통합 분석 API가 이미 뉴스를 포함하므로, 이 버튼이 별도로 필요한지 확인하세요.
                                만약 '뉴스 요약'을 독립적인 기능으로 제공하고 싶다면, 백엔드에 해당 API를 명확히 분리해야 합니다. */}
                    <div
                        className={`ai-analysis-card ${isLoadingSummaries ? 'disabled' : ''}`}
                        onClick={!isLoadingSummaries ? handleNewsSummary : undefined}
                    >
                        <div className="ai-card-icon">📰</div>
                        <div className="ai-card-content">
                            <h4 className="ai-card-title">
                                {isLoadingSummaries ? '요약 정보 로딩 중...' : '뉴스 요약'}
                            </h4>
                            <p className="ai-card-description">최신 뉴스를 AI가 분석하여, 종목 관련 핵심 이슈와 시장 영향을 요약해 드립니다.</p>
                        </div>
                    </div>

                    {/* 통합 분석 버튼 */}
                    {/* 통합 분석은 백엔드에서 모든 데이터를 가져오므로, 여기서는 단순히 API를 호출하면 됩니다.
                                  UI 상의 'disabled' 조건은 사용자의 이해를 돕기 위함입니다. */}
                    <div 
                        className="ai-analysis-card" // 조건부 disabled 클래스는 제거하여 항상 클릭 가능하게 함
                        onClick={handleConsolidatedAnalysis}
                    >
                        <div className="ai-card-icon">💡</div>
                        <div className="ai-card-content">
                            <h4 className="ai-card-title">통합 분석</h4>
                            <p className="ai-card-description">차트, 뉴스 등 다양한 데이터를 종합 분석하여 최종 투자 결정을 지원합니다.</p>
                        </div>
                    </div>
                </div>
            </div>

            {isLoadingSummaries && !summaries.length && <p className="loading-message">뉴스 요약 정보를 불러오는 중입니다...</p>}
            {summaryError && <p style={{ color: 'red', marginTop: '10px' }}>오류: {summaryError}</p>}

            {!isLoadingSummaries && summaries.length > 0 && (
                <div className="news-summaries-section">
                    <h4>뉴스 요약 결과 ({stockName || ticker}):</h4>
                    {summaries.map((summary, index) => {
                        if (summary.type === 'no_news' || summary.type === 'empty_summary') {
                            return <p key={index} className="info-message">{summary.message}</p>;
                        }
                        return summary ? (
                           <div key={summary.link || index} className="news-summary-item">
                                <h5>{summary.title || '제목 없음'}</h5>
                                <p><strong>날짜:</strong> {summary.date || '정보 없음'}</p>
                                <p><strong>주요 이슈:</strong> {summary.issue || '정보 없음'}</p> {/* 'summary.issue'를 사용 */}
                                <p><strong>시장 영향:</strong> {summary.impact || '정보 없음'}</p> {/* 'summary.impact'를 사용하도록 주석 해제 */}
                                {summary.link && <p><a href={summary.link} target="_blank" rel="noopener noreferrer">원본 기사 보기</a></p>}
                            </div>
                        ) : (
                            <p key={index} className="error-message">이 항목에 대한 요약 정보를 가져오지 못했습니다.</p>
                        );
                    })}
                </div>
            )}

            {/* 차트 분석 모달 */}
            <ChartModal
                isOpen={isChartModalOpen}
                onClose={() => setIsChartModalOpen(false)}
                title={`${stockName || ticker} 차트 분석`}
            >
                <div className="modal-chart-display">
                    <iframe
                        key={`${countryForChart}-${ticker}-${endDate}-modal`}
                        className="chart-iframe"
                        src={chartIframeSrc}
                        title={`${stockName || ticker} Stock Chart (${countryForChart.toUpperCase()})`}
                    ></iframe>
                </div>
                <div className="modal-analysis-result">
                    <h4>AI 차트 분석 결과</h4>
                    {isLoadingChartAnalysis && <p className="loading-message">차트 데이터를 분석 중입니다. 잠시만 기다려주세요...</p>}
                    {chartAnalysisError && <p className="error-message">오류: {chartAnalysisError}</p>}
                    {chartAnalysisResult && !isLoadingChartAnalysis && !chartAnalysisError && (
                        <pre className="analysis-text">{chartAnalysisResult}</pre>
                    )}
                </div>
            </ChartModal>

            {/* 통합 분석 모달 */}
            <ChartModal
                isOpen={isConsolidatedModalOpen}
                onClose={() => setIsConsolidatedModalOpen(false)}
                title={`${stockName || ticker} 통합 분석`}
            >
                <div className="modal-chart-display">
                    <iframe
                        key={`${countryForChart}-${ticker}-${endDate}-modal-consolidated`}
                        className="chart-iframe"
                        src={chartIframeSrc}
                        title={`${stockName || ticker} Stock Chart (${countryForChart.toUpperCase()})`}
                    ></iframe>
                </div>
                <div className="modal-analysis-result">
                    <h4>AI 통합 분석 결과</h4>
                    {isLoadingConsolidatedAnalysis && <p className="loading-message">차트와 뉴스 데이터를 종합하여 분석 중입니다. 잠시만 기다려주세요...</p>}
                    {consolidatedAnalysisError && <p className="error-message">오류: {consolidatedAnalysisError}</p>}
                    {consolidatedAnalysisResult && !isLoadingConsolidatedAnalysis && !consolidatedAnalysisError && (
                           <pre className="analysis-text">{consolidatedAnalysisResult}</pre>
                    )}
                </div>
            </ChartModal>
        </div>
    );
}