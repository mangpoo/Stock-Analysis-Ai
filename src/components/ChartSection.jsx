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

    // --- 뉴스 요약 핸들러 (MODIFIED) ---
    const handleNewsSummary = async () => {
        if (!ticker) {
            setSummaryError("종목 코드가 없습니다.");
            return;
        }
        if (isLoadingSummaries) return;

        setIsLoadingSummaries(true);
        setSummaryError(null);
        setSummaries([]);

        try {
            let nameForNews = stockName; // 기본값으로 현재 종목명 사용

            // 미국 주식일 경우, 한글 종목명을 조회
            if (stockCountryCode === 'us') {
                console.log(`미국 종목(${ticker})의 한글 이름 조회를 시작합니다.`);
                try {
                    const krNameResponse = await fetch(API_CONFIG.endpoints.getKrName(ticker));
                    if (krNameResponse.ok) {
                        const krNameData = await krNameResponse.json();
                        // **MODIFICATION START**
                        // 한글 이름이 있고, 'N/A'가 아닐 때만 한글 이름 사용
                        if (krNameData.name && krNameData.name !== 'N/A') {
                            nameForNews = krNameData.name;
                            console.log(`뉴스 요약에 사용할 한글 이름: '${nameForNews}'`);
                        } else {
                            // 받은 값이 'N/A'이거나 이름이 없는 경우, 원래 영문명을 사용
                            console.log(`'${ticker}'에 대한 유효한 한글 이름이 없습니다 (받은 값: ${krNameData.name}). 기존 영문명 '${stockName}'을(를) 사용합니다.`);
                        }
                        // **MODIFICATION END**
                    } else {
                        console.warn(`한글 이름 조회 API 호출 실패. 기존 종목명 '${stockName}'을(를) 사용합니다.`);
                    }
                } catch (error) {
                    console.error("한글 이름 조회 중 오류 발생. 기존 종목명을 사용합니다:", error);
                }
            }
            
            console.log(`뉴스 요약 요청 시작: ${nameForNews} (국가: ${stockCountryCode})`);

            // 결정된 이름(한글 또는 영문)으로 크롤러 API 호출
            const crawlerResponse = await fetch(API_CONFIG.endpoints.crawler(nameForNews));
            if (!crawlerResponse.ok) {
                const errorData = await crawlerResponse.text();
                throw new Error(`뉴스 목록을 가져오는데 실패했습니다: ${crawlerResponse.status} ${crawlerResponse.statusText} - ${errorData}`);
            }

            const newsIdPathsObject = await crawlerResponse.json();
            const actualNewsIdPaths = newsIdPathsObject.success || [];

            if (actualNewsIdPaths.length === 0) {
                console.log("요약할 뉴스가 없습니다.");
                setSummaries([{ type: 'no_news', message: '요약할 뉴스가 없습니다.' }]);
                setIsLoadingSummaries(false);
                return;
            }

            console.log("가져온 뉴스 경로 목록 (처리 대상):", actualNewsIdPaths);

            const summaryPromises = actualNewsIdPaths.slice(0, 5).map(pathString => {
                if (typeof pathString !== 'string') {
                    console.warn("경로 목록에 문자열이 아닌 요소가 포함되어 있습니다:", pathString);
                    return Promise.resolve(null);
                }
                
                const fullSummaryUrl = `https://ddolddol2.duckdns.org/ai${pathString}`;

                return fetch(fullSummaryUrl, { timeout: 20000 })
                    .then(res => {
                        if (!res.ok) {
                            console.error(`뉴스 요약 요청 실패 (${fullSummaryUrl}): ${res.status} ${res.statusText}`);
                            return Promise.reject(new Error(`뉴스 요약 요청 실패 (${fullSummaryUrl})`));
                        }
                        return res.json();
                    })
                    .then(data => ({
                        title: data.title || '제목 없음',
                        issue: data.issue || '주요 이슈 정보 없음',
                        impact: data.impact || '시장 영향 정보 없음',
                        date: data.date || '날짜 없음',
                        link: data.link || fullSummaryUrl
                    }))
                    .catch(err => {
                        console.error(`뉴스 요약 처리 중 오류 [${fullSummaryUrl}]:`, err);
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

    // ... (이하 나머지 컴포넌트 코드는 이전과 동일합니다) ...
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
                    <div
                        className="ai-analysis-card"
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
                                <p><strong>주요 이슈:</strong> {summary.issue || '정보 없음'}</p>
                                <p><strong>시장 영향:</strong> {summary.impact || '정보 없음'}</p>
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