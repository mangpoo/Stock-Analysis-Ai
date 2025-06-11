// src/components/ChartSection.jsx

import React, { useState } from 'react';
import './ChartSection.css';
import ChartModal from './ChartModal';
import API_CONFIG from '../config';

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

    const handleChartAnalysis = async () => {
        if (!ticker) {
            setChartAnalysisError("종목 코드가 없습니다. 차트 분석을 할 수 없습니다.");
            return;
        }

        setIsChartModalOpen(true);
        setIsLoadingChartAnalysis(true);
        setChartAnalysisResult(null);
        setChartAnalysisError(null);

        console.log(`차트 분석 요청 시작: ${ticker} (국가: ${stockCountryCode})`);

        try {
            // 1. 최근 1년간의 주가 데이터 가져오기
            const today = new Date();
            const endDate = today.toISOString().slice(0, 10).replace(/-/g, '');
            const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));
            const startDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');
            
            const stockDataUrl = API_CONFIG.endpoints.stockData(stockCountryCode, ticker, startDate, endDate);
            console.log(`주가 데이터 요청 URL: ${stockDataUrl}`);

            const stockDataResponse = await fetch(stockDataUrl);
            if (!stockDataResponse.ok) {
                throw new Error(`주가 데이터(OHLCV)를 가져오는데 실패했습니다: ${stockDataResponse.statusText}`);
            }
            const historicalData = await stockDataResponse.json();

            // 2. 주가 데이터를 포함하여 동적 프롬프트 생성
            const promptText = `
                ${stockName || ticker} 주식에 대한 차트 분석을 요청합니다.
                현재 주가: ${stockPrice}, 등락률: ${stockChange}%.

                최근 1년간의 일별 주가 데이터(JSON 형식)는 다음과 같습니다:
                ${JSON.stringify(historicalData)}

                이 데이터를 바탕으로 다음 항목을 포함하여 종합적인 기술적 분석과 실행 가능한 매매 전략을 제시해 주세요:
                1.  **주요 추세**: 현재 장기 및 단기 추세 (상승, 하락, 횡보)는 무엇입니까?
                2.  **지지선/저항선**: 중요한 지지선과 저항선 레벨을 구체적인 가격으로 알려주세요.
                3.  **기술적 지표 분석**: 이동평균선(MA), 상대강도지수(RSI), MACD 등 주요 지표를 해석해주세요.
                4.  **거래량 분석**: 최근 거래량 패턴은 무엇을 의미합니까?
                5.  **예상 시나리오**: 가장 가능성 있는 상승 및 하락 시나리오를 설명해주세요.
                6.  **매매 전략**: 위 분석을 바탕으로 단기 및 중장기적 관점에서의 매수, 매도, 또는 보유 전략을 제안해주세요.
            `;

            // 3. 생성된 프롬프트로 ChatGPT 분석 API 호출
            const chatGptResponse = await fetch(API_CONFIG.endpoints.chatGptAnalyzeChart, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: promptText, 
                    ticker: ticker, 
                    countryCode: stockCountryCode 
                }),
            });

            if (!chatGptResponse.ok) {
                const errorData = await chatGptResponse.text();
                throw new Error(`ChatGPT 분석 실패: ${chatGptResponse.status} ${chatGptResponse.statusText} - ${errorData}`);
            }

            const analysisData = await chatGptResponse.json();
            setChartAnalysisResult(analysisData.analysis_text || "분석 결과를 가져오지 못했습니다.");
            console.log("ChatGPT 차트 분석 결과:", analysisData);

        } catch (error) {
            console.error("차트 분석 처리 중 오류:", error);
            setChartAnalysisError(error.message);
        } finally {
            setIsLoadingChartAnalysis(false); // 분석 로딩 종료
        }
    };

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
            const crawlerResponse = await fetch(API_CONFIG.endpoints.crawler(ticker));
            if (!crawlerResponse.ok) {
                const errorData = await crawlerResponse.text();
                throw new Error(`뉴스 목록을 가져오는데 실패했습니다: ${crawlerResponse.status} ${crawlerResponse.statusText} - ${errorData}`);
            }

            const newsIdPathsObject = await crawlerResponse.json();
            const arraysOfPaths = Object.values(newsIdPathsObject);
            const actualNewsIdPaths = arraysOfPaths.length > 0 && Array.isArray(arraysOfPaths[0]) ? arraysOfPaths[0] : [];

            if (actualNewsIdPaths.length === 0) {
                console.log("요약할 뉴스가 없습니다.");
                setSummaries([{ type: 'no_news', message: '요약할 뉴스가 없습니다.' }]);
                setIsLoadingSummaries(false);
                return;
            }

            console.log("가져온 뉴스 경로 목록 (처리 대상):", actualNewsIdPaths);

            const summaryPromises = actualNewsIdPaths.map(pathString => {
                if (typeof pathString !== 'string') {
                    console.warn("경로 목록에 문자열이 아닌 요소가 포함되어 있습니다:", pathString);
                    return Promise.resolve(null);
                }
                const pathParts = pathString.split('/');
                const newsId = pathParts[pathParts.length - 1];
                if (!newsId || newsId.trim() === "") {
                    console.warn("잘못된 형식의 뉴스 ID 경로:", pathString);
                    return Promise.resolve(null);
                }

                const fullSummaryUrl = API_CONFIG.endpoints.getSummary(newsId);
                console.log(`요약 요청 URL: ${fullSummaryUrl}`);

                return fetch(fullSummaryUrl)
                    .then(async res => {
                        if (!res.ok) {
                            const errorBody = await res.text();
                            console.error(`ID [${newsId}]에 대한 요약을 가져오는데 실패했습니다: ${res.status} ${res.statusText} - ${errorBody}`);
                            return null;
                        }
                        return res.json();
                    })
                    .catch(err => {
                        console.error(`ID [${newsId}] 요청 중 네트워크 또는 기타 오류:`, err);
                        return null;
                    });
            });

            const fetchedSummaries = (await Promise.all(summaryPromises)).filter(summary => summary !== null);

            if (fetchedSummaries.length === 0 && actualNewsIdPaths.length > 0) {
                console.log("모든 뉴스 항목을 요약하지 못했거나, 요약 결과가 비어있습니다.");
                setSummaries([{ type: 'empty_summary', message: '뉴스 요약 정보를 가져왔으나 내용이 없습니다.' }]);
            } else if (fetchedSummaries.length > 0) {
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

    // 통합 분석 기능 핸들러
    const handleConsolidatedAnalysis = async () => {
        // 모달 열고 초기 상태 설정
        setIsConsolidatedModalOpen(true);
        setConsolidatedAnalysisResult(null);
        setConsolidatedAnalysisError(null);

        // 차트 분석 및 뉴스 요약 데이터가 있는지 확인
        if (!chartAnalysisResult || summaries.length === 0) {
            setConsolidatedAnalysisError("'차트 분석'과 '뉴스 요약'을 먼저 실행하여 데이터가 필요합니다.");
            return;
        }

        setIsLoadingConsolidatedAnalysis(true);

        try {
            // 뉴스 요약 결과를 텍스트 형식으로 변환
            const newsSummariesText = summaries
                .map(s => `- 뉴스 제목: ${s.title || '제목 없음'}\n  - 핵심 이슈: ${s.issue || '정보 없음'}\n  - 시장 영향: ${s.impact || '정보 없음'}`)
                .join('\n\n');

            // 통합 분석을 위한 프롬프트 생성
            const promptText = `
                ### **${stockName || ticker} 주식 통합 분석 요청**

                **1. AI 기반 기술적 분석 결과:**
                ---
                ${chartAnalysisResult}
                ---

                **2. 최신 뉴스 요약:**
                ---
                ${newsSummariesText}
                ---

                **### 요청 사항:**
                위의 '기술적 분석'과 '뉴스 요약'을 종합적으로 고려하여, 투자자를 위한 최종 투자 전략을 제시해주세요. 다음 항목을 반드시 포함하여 구체적이고 실행 가능한 답변을 생성해주세요:

                1.  **종합 평가 (Executive Summary):** 현재 주식의 상태를 '긍정적', '부정적', 또는 '중립적'으로 평가하고, 그 핵심 이유를 2~3문장으로 요약해주세요.
                2.  **단기적 투자 전략 (1~4주):** 구체적인 진입 및 목표 가격, 손절 가격을 포함한 단기 매매 전략을 제시해주세요.
                3.  **중장기적 투자 전략 (6개월~1년):** 중장기적 관점에서의 주가 전망과 투자 전략을 설명해주세요.
                4.  **주요 리스크 요인:** 현재 분석에서 가장 중요하게 고려해야 할 잠재적 리스크는 무엇인가요?
                5.  **핵심 기회 요인:** 반대로, 주가 상승을 이끌 수 있는 핵심 기회 요인은 무엇인가요?
            `;

            // 통합 분석 API 호출
            const response = await fetch(API_CONFIG.endpoints.chatGptConsolidatedAnalysis, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: promptText, 
                    ticker: ticker, 
                    countryCode: stockCountryCode 
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`통합 분석에 실패했습니다: ${response.status} - ${errorData}`);
            }

            const resultData = await response.json();
            setConsolidatedAnalysisResult(resultData.analysis_text || "분석 결과를 가져오지 못했습니다.");

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
    const chartIframeSrc = API_CONFIG.endpoints.chartIframe(chartServerIp, countryForChart, ticker, startDate, endDate);

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
                        onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentNode;
                            if (parent) {
                                const textNode = document.createElement('span');
                                textNode.textContent = '로고';
                                if (parent.classList.contains('image-placeholder-container')) {
                                    parent.appendChild(textNode);
                                } else {
                                    e.target.insertAdjacentElement('afterend', textNode);
                                }
                            }
                        }}
                    />
                ) : (
                    <div className="image-placeholder-container">
                        <div className="image-placeholder">로고</div>
                    </div>
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

                    <div className="ai-analysis-card" onClick={handleChartAnalysis}>
                        <div className="ai-card-icon">📊</div>
                        <div className="ai-card-content">
                            <h4 className="ai-card-title">차트 분석</h4>
                            <p className="ai-card-description">주요 차트 패턴과 기술적 지표를 분석하여 매매 전략 수립에 도움을 드립니다.</p>
                        </div>
                    </div>

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

                    <div 
                        className={`ai-analysis-card ${!chartAnalysisResult || summaries.length === 0 ? 'disabled' : ''}`} 
                        onClick={handleConsolidatedAnalysis}
                        title={!chartAnalysisResult || summaries.length === 0 ? "차트 분석과 뉴스 요약을 먼저 실행해주세요." : "통합 분석 실행"}
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
                                <p><strong>영향:</strong> {summary.impact || '정보 없음'}</p>
                                {summary.link && <p><a href={summary.link} target="_blank" rel="noopener noreferrer">원본 기사 보기</a></p>}
                                {summary.related_tickers && summary.related_tickers.length > 0 && (
                                    <p><strong>관련 티커:</strong> {summary.related_tickers.join(', ')}</p>
                                )}
                            </div>
                        ) : (
                            <p key={index} className="error-message">이 항목에 대한 요약 정보를 가져오지 못했습니다.</p>
                        );
                    })}
                </div>
            )}
            {!isLoadingSummaries && !summaryError && summaries.length === 0 && ticker && !isLoadingSummaries && (
                <div style={{ marginTop: '10px' }}>
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
                        <p>{chartAnalysisResult}</p>
                    )}
                    {!isLoadingChartAnalysis && !chartAnalysisError && !chartAnalysisResult && (
                        <p>분석 결과를 기다리고 있습니다.</p>
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
                        <p>{consolidatedAnalysisResult}</p>
                    )}
                    {!isLoadingConsolidatedAnalysis && !consolidatedAnalysisError && !consolidatedAnalysisResult && (
                        <p>분석 결과를 기다리고 있습니다.</p>
                    )}
                </div>
            </ChartModal>
        </div>
    );
}