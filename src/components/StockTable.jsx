import React, { useState, useEffect, useCallback } from "react";
import "./StockTable.css";
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../config'; 

export default function StockTable() {
    const [currentPage, setCurrentPage] = useState(1);
    const [krChartData, setKrChartData] = useState([]);
    const [usChartData, setUsChartData] = useState([]);
    const [currentStockType, setCurrentStockType] = useState('kr');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentChangeRankData, setCurrentChangeRankData] = useState([]);
    const [sortTypeForChangeRank, setSortTypeForChangeRank] = useState('initial');

    const ITEMS_PER_PAGE = 10;
    const CHANGE_RANK_ITEMS_COUNT = 10;

    const navigate = useNavigate();

    const fetchChartData = useCallback(async (stockType) => {
        try {
            // 1. 추천 종목 목록 가져오기 (이름과 티커를 위해 필요)
            const listResponse = await fetch(API_CONFIG.endpoints.recommendList(stockType));
            if (!listResponse.ok) {
                throw new Error(`추천 종목 목록 로딩 실패: ${listResponse.status}`);
            }
            const initialStockList = await listResponse.json(); // 예: [{ ticker: '005930', stock_name: '삼성전자' }, ...]

            if (!Array.isArray(initialStockList) || initialStockList.length === 0) {
                console.log(`추천 종목 목록이 비어있습니다 (${stockType}).`);
                return [];
            }

            // 2. 새로운 bulk API로 모든 종목의 가격/변동률 정보 한 번에 가져오기
            const allChangesResponse = await fetch(API_CONFIG.endpoints.getAllChanges(stockType));
            if (!allChangesResponse.ok) {
                throw new Error(`전체 가격 정보 로딩 실패: ${allChangesResponse.status}`);
            }
            const allChangesData = await allChangesResponse.json(); // 예: [{ ticker: '005930', changerate: { ... } }, ...]

            // 3. 빠른 조회를 위해 가격/변동률 데이터를 Map 형태로 변환 (key: 티커)
            const changesMap = new Map();
            allChangesData.forEach(item => {
                if (item.ticker && item.changerate) {
                    changesMap.set(item.ticker, item.changerate);
                }
            });

            // 4. 추천 종목 목록을 기준으로, Map에서 데이터를 합쳐 최종 데이터 생성
            const finalChartData = initialStockList.map(stock => {
                const changeInfo = changesMap.get(stock.ticker);
                const priceValue = changeInfo ? changeInfo.yesterday_close : "N/A";
                const changeRate = changeInfo ? changeInfo.change_rate : 0.0;

                return {
                    name: stock.stock_name,
                    ticker: stock.ticker,
                    price: typeof priceValue === 'number' ? priceValue : "N/A",
                    change: typeof changeRate === 'number' ? changeRate : 0.0,
                    logo: API_CONFIG.endpoints.stockLogo(stockType, stock.ticker),
                };
            });

            return finalChartData;

        } catch (e) {
            console.error(`차트 데이터 로딩 중 전체 오류 발생 (${stockType}):`, e);
            setError(`데이터 로딩 실패 (${stockType}): ${e.message}`);
            return [];
        }
    }, []); // 종속성 배열은 비어있어도 괜찮습니다.

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [krData, usData] = await Promise.all([
                    fetchChartData('kr'),
                    fetchChartData('us')
                ]);

                setKrChartData(krData);
                setUsChartData(usData);

                const initialDataForChangeRank = [...krData]
                    .sort((a, b) => b.change - a.change)
                    .slice(0, CHANGE_RANK_ITEMS_COUNT);
                setCurrentChangeRankData(initialDataForChangeRank);
                setSortTypeForChangeRank('gainers');

            } catch (e) {
                console.error("전체 데이터 로딩 중 오류 발생:", e);
                setError(`전체 데이터 로딩 실패: ${e.message}`);
                setKrChartData([]);
                setUsChartData([]);
                setCurrentChangeRankData([]);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [fetchChartData, CHANGE_RANK_ITEMS_COUNT]);

    const allChartData = currentStockType === 'kr' ? krChartData : usChartData;

    const handleSortChangeRank = (type) => {
        const dataToSort = currentStockType === 'kr' ? krChartData : usChartData;

        if (!dataToSort || dataToSort.length === 0) {
            setCurrentChangeRankData([]);
            setSortTypeForChangeRank(type);
            return;
        }

        let sortedData = [...dataToSort];

        if (type === 'gainers') {
            sortedData.sort((a, b) => b.change - a.change);
        } else if (type === 'losers') {
            sortedData.sort((a, b) => a.change - b.change);
        }

        setCurrentChangeRankData(sortedData.slice(0, CHANGE_RANK_ITEMS_COUNT));
        setSortTypeForChangeRank(type);
    };

    const handleChangeStockType = (type) => {
        setCurrentStockType(type);
        setCurrentPage(1);

        const dataForChangeRank = type === 'kr' ? krChartData : usChartData;
        const newSortType = 'gainers';

        const sortedData = [...dataForChangeRank]
            .sort((a, b) => b.change - a.change)
            .slice(0, CHANGE_RANK_ITEMS_COUNT);

        setCurrentChangeRankData(sortedData);
        setSortTypeForChangeRank(newSortType);
    };

    const totalPages = Math.ceil(allChartData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentChartPageData = allChartData.slice(startIndex, endIndex);

    // 찜하기 버튼 클릭 핸들러 제거
    // const handleFavoriteClick = (e, stockName) => {
    //     e.stopPropagation();
    //     console.log(`${stockName} 찜 상태 변경됨`);
    // };

    const handlePageChange = (page) => {
        if (page === 'prev') setCurrentPage((prev) => Math.max(prev - 1, 1));
        else if (page === 'next') setCurrentPage((prev) => Math.min(prev + 1, totalPages));
        else setCurrentPage(page);
    };

    const handleStockRowClick = (stock) => {
        if (stock && stock.ticker && stock.ticker !== "티커 없음" && stock.ticker !== "오류") {
            const priceToSend = typeof stock.price === 'number' ? stock.price : "N/A";
            const changeToSend = typeof stock.change === 'number' ? stock.change : 0.0;
            navigate(`/chart/${stock.ticker}`, {
                state: {
                    stockName: stock.name,
                    stockPrice: priceToSend,
                    stockChange: changeToSend,
                    stockType: currentStockType
                }
            });
        } else {
            console.warn("유효하지 않은 종목 정보로 차트 페이지로 이동할 수 없습니다:", stock);
        }
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        if (totalPages <= maxPagesToShow + 1) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(<button key={i} className={i === currentPage ? 'active' : ''} onClick={() => handlePageChange(i)}>{i}</button>);
        } else {
            let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            if (endPage === totalPages) startPage = Math.max(1, totalPages - maxPagesToShow + 1);
            if (startPage > 1) {
                pageNumbers.push(<button key={1} onClick={() => handlePageChange(1)}>1</button>);
                if (startPage > 2) pageNumbers.push(<span key="start-ellipsis">...</span>);
            }
            for (let i = startPage; i <= endPage; i++) pageNumbers.push(<button key={i} className={i === currentPage ? 'active' : ''} onClick={() => handlePageChange(i)}>{i}</button>);
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pageNumbers.push(<span key="end-ellipsis">...</span>);
                pageNumbers.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)}>{totalPages}</button>);
            }
        }
        return pageNumbers;
    };

    if (loading) return <div className="stock-table loading">데이터를 불러오는 중입니다...</div>;
    if (error) return <div className="stock-table error">오류: {error}</div>;

    return (
        <div className="stock-table">
            <div className="table-container">
                {/* 차트 테이블 영역 */}
                <div className="chart-table">
                    <div className="chart-header">
                        <h2>차트</h2>
                        <div className="chart-rank-controls">
                            <button
                                onClick={() => handleChangeStockType('kr')}
                                className={currentStockType === 'kr' ? 'active-sort' : ''}
                            >
                                KR
                            </button>
                            <button
                                onClick={() => handleChangeStockType('us')}
                                className={currentStockType === 'us' ? 'active-sort' : ''}
                            >
                                US
                            </button>
                        </div>
                    </div>
                    <div className="chart-table-body-wrapper"> {/* 스크롤을 위한 래퍼 추가 */}
                        <table>
                            <thead>
                                <tr>
                                    <th className="rank-header"></th>
                                    <th>종목</th>
                                    <th>전일종가</th> {/* 헤더는 항상 '전일종가' */}
                                    <th>등락률</th>
                                    {/* 찜하기 헤더 제거 */}
                                    {/* <th className="favorite-header"></th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {currentChartPageData.map((stock, index) => (
                                    <tr key={`${stock.ticker}-${index}`} className="stock-row" onClick={() => handleStockRowClick(stock)}>
                                        <td className="rank-cell">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                        <td className="stock-name-cell">
                                            {stock.logo && (
                                                <img
                                                    src={stock.logo}
                                                    alt={`${stock.name} 로고`}
                                                    className="stock-logo"
                                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                                />
                                            )}
                                            <span>{stock.name}</span>
                                        </td>
                                        <td>
                                            {typeof stock.price === 'number'
                                                ? `${currentStockType === 'us' ? '$' : ''}${stock.price.toLocaleString('en-US', { minimumFractionDigits: currentStockType === 'us' ? 2 : 0 })}${currentStockType === 'kr' ? '원' : ''}`
                                                : stock.price}
                                        </td>
                                        <td className={stock.change >= 0 ? "positive" : "negative"}>
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                                        </td>
                                        {/* 찜하기 셀 제거 */}
                                        {/* <td className="favorite-cell">
                                            <span className="favorite-icon" onClick={(e) => handleFavoriteClick(e, stock.name)} title={`${stock.name} 찜하기`}>♥</span>
                                        </td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>&lt;</button>
                            {renderPageNumbers()}
                            <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>&gt;</button>
                        </div>
                    )}
                </div>

                {/* 세로 구분선 */}
                <div className="vertical-line"></div>

                {/* 변동순 테이블 영역 */}
                <div className="change-rank">
                    <div className="change-rank-header">
                        <h2 className="title-2">변동 순</h2>
                        <div className="change-rank-controls">
                            <button
                                onClick={() => handleSortChangeRank('gainers')}
                                className={sortTypeForChangeRank === 'gainers' ? 'active-sort' : ''}
                            >
                                상승
                            </button>
                            <button
                                onClick={() => handleSortChangeRank('losers')}
                                className={sortTypeForChangeRank === 'losers' ? 'active-sort' : ''}
                            >
                                하락
                            </button>
                        </div>
                    </div>
                    <div className="change-rank-body-wrapper">
                        <table>
                            <thead>
                                <tr><th>종목</th><th>등락률</th>{/* 찜하기 헤더 제거 */}{/* <th className="favorite-header"></th> */}</tr>
                            </thead>
                            <tbody>
                                {currentChangeRankData.map((stock, index) => (
                                    <tr key={`${stock.ticker}-${index}`} className="stock-row" onClick={() => handleStockRowClick(stock)}>
                                        <td className="stock-name-cell">
                                            {stock.logo && (
                                                <img
                                                    src={stock.logo}
                                                    alt={`${stock.name} 로고`}
                                                    className="stock-logo"
                                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                                />
                                            )}
                                            <span>{stock.name}</span>
                                        </td>
                                        <td className={stock.change >= 0 ? "positive" : "negative"}>
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                                        </td>
                                        {/* 찜하기 셀 제거 */}
                                        {/* <td className="favorite-cell">
                                            <span className="favorite-icon" onClick={(e) => handleFavoriteClick(e, stock.name)} title={`${stock.name} 찜하기`}>♥</span>
                                        </td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}