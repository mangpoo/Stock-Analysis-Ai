import React, { useState } from 'react';
import './ChartSection.css';
// config.jsx 파일 import
import API_CONFIG from '../config'; // 경로는 프로젝트 구조에 따라 조정

export default function ChartSection({ ticker, stockName, stockPrice, stockChange, logoUrl, chartServerIp, stockCountryCode }) {
    const [summaries, setSummaries] = useState([]);
    const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    const handleChartAnalysis = () => {
        console.log(`차트 분석 버튼 클릭됨: ${ticker} (국가: ${stockCountryCode})`);
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
            // config.jsx의 crawler endpoint 사용
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

                // config.jsx의 getSummary endpoint 사용
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

    const handleOtherAction = () => {
        console.log(`통합 분석 버튼 클릭됨: ${ticker} (국가: ${stockCountryCode})`);
    };

    const startDate = "20000101";
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const endDate = `${year}${month}${day}`;

    const countryForChart = (stockCountryCode === 'us'   || stockCountryCode === 'kr') ? stockCountryCode : 'kr';
    // config.jsx의 chartIframe endpoint 사용
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

                    <div className="ai-analysis-card" onClick={handleOtherAction}>
                        <div className="ai-card-icon">💡</div>
                        <div className="ai-card-content">
                            <h4 className="ai-card-title">통합 분석</h4>
                            <p className="ai-card-description">차트, 뉴스, 수급 등 다양한 데이터를 종합적으로 분석하여 투자 결정을 지원합니다.</p>
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
        </div>
    );
}