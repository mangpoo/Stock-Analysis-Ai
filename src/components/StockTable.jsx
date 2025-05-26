// StockTable.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./StockTable.css";
import { useNavigate } from 'react-router-dom';

export default function StockTable() {
    const [currentPage, setCurrentPage] = useState(1);
    const [allChartData, setAllChartData] = useState([]); // 서버에서 가져온 추천 종목 + 상세 정보
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // "변동 순" 테이블에 표시될 데이터와 정렬 타입을 위한 상태
    const [currentChangeRankData, setCurrentChangeRankData] = useState([]);
    const [sortTypeForChangeRank, setSortTypeForChangeRank] = useState('initial'); // 'initial', 'gainers', 'losers'

    const ITEMS_PER_PAGE = 10; // 차트 테이블 페이지당 아이템 수
    const CHANGE_RANK_ITEMS_COUNT = 10; // 변동 순 테이블에 표시할 아이템 수
    const IP = "172.17.154.182:8080";

    const navigate = useNavigate();

    const fetchChartData = useCallback(async () => { // useCallback으로 감싸서 의존성 배열 관리 용이하게
        setLoading(true);
        setError(null);
        try {
            const listResponse = await fetch(`http://${IP}/recommend/kr`);
            if (!listResponse.ok) {
                throw new Error(`종목 목록 로딩 실패: ${listResponse.status}`);
            }
            const initialStockList = await listResponse.json();

            if (!Array.isArray(initialStockList) || initialStockList.length === 0) {
                console.log("추천 종목 목록이 비어있습니다.");
                setAllChartData([]);
                setCurrentChangeRankData([]); // 추천 목록 없으면 변동순도 비움
                setLoading(false);
                return;
            }

            const detailPromises = initialStockList.map(async (stock) => {
                if (!stock.ticker || !stock.stock_name) {
                    console.warn("종목 목록 데이터에 ticker 또는 stock_name이 없습니다:", stock);
                    return { name: stock.stock_name || "이름 없음", ticker: stock.ticker || "티커 없음", price: "N/A", change: 0.0, logo: `http://${IP}/logo/kr/${stock.ticker || 'default'}` };
                }
                try {
                    const detailResponse = await fetch(`http://${IP}/changerate/kr/${stock.ticker}`);
                    if (!detailResponse.ok) {
                        console.warn(`티커 ${stock.ticker} 상세 정보 로딩 실패: ${detailResponse.status}`);
                        return { name: stock.stock_name, ticker: stock.ticker, price: "N/A", change: 0.0, logo: `http://${IP}/logo/kr/${stock.ticker}` };
                    }
                    const details = await detailResponse.json();
                    return {
                        name: stock.stock_name,
                        ticker: stock.ticker,
                        price: typeof details.yesterday_close === 'number' ? details.yesterday_close : "N/A",
                        change: typeof details.change_rate === 'number' ? details.change_rate : 0.0,
                        logo: `http://${IP}/logo/kr/${stock.ticker}`, // 로고 URL 미리 구성
                    };
                } catch (e) {
                    console.error(`티커 ${stock.ticker} 상세 정보 fetch 또는 처리 중 오류:`, e);
                    return { name: stock.stock_name, ticker: stock.ticker, price: "N/A", change: 0.0, logo: `http://${IP}/logo/kr/${stock.ticker}` };
                }
            });

            const combinedDataResults = await Promise.allSettled(detailPromises);
            const finalChartData = combinedDataResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            setAllChartData(finalChartData);

            // 초기 "변동 순" 데이터 설정 (예: allChartData 기반의 기본 정렬 또는 기존 예시 데이터)
            // 여기서는 allChartData가 있다면, 등락률 절댓값 큰 순으로 초기 설정 (예시)
            if (finalChartData.length > 0) {
                const initiallySortedChangeData = [...finalChartData]
                    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)) // 등락률 절댓값 기준
                    .slice(0, CHANGE_RANK_ITEMS_COUNT);
                setCurrentChangeRankData(initiallySortedChangeData);
            } else {
                // finalChartData가 없을 경우, 기존 setupChangeRankData의 예시 데이터를 사용하거나 비워둠
                // 여기서는 비워두는 것으로 처리
                setCurrentChangeRankData([]);
            }
            setSortTypeForChangeRank('initial');


        } catch (e) {
            console.error("차트 데이터 로딩 중 전체 오류 발생:", e);
            setError(`데이터 로딩 실패: ${e.message}`);
            setAllChartData([]);
            setCurrentChangeRankData([]);   
        } finally {
            setLoading(false);
        }
    }, [IP, CHANGE_RANK_ITEMS_COUNT]); // 의존성 배열에 IP, CHANGE_RANK_ITEMS_COUNT 추가

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]); // fetchChartData를 의존성 배열에 추가

    // 변동순 정렬 함수
    const handleSortChangeRank = (type) => {
        if (!allChartData || allChartData.length === 0) {
            console.log("정렬할 차트 데이터가 없습니다.");
            setCurrentChangeRankData([]); // 데이터 없으면 빈 배열로 설정
            setSortTypeForChangeRank(type);
            return;
        }

        let sortedData = [...allChartData]; // 원본 배열 수정을 피하기 위해 복사

        if (type === 'gainers') { // 상승률 순
            sortedData.sort((a, b) => b.change - a.change); // 등락률 내림차순
        } else if (type === 'losers') { // 하락률 순
            sortedData.sort((a, b) => a.change - b.change); // 등락률 오름차순 (음수값이 더 작은 것이 큰 하락)
        } else { // 'initial' 또는 기타 (여기서는 초기 상태로 되돌리거나 기본 정렬을 할 수 있음)
             // 초기 상태로 되돌리기 (등락률 절댓값 기준)
             sortedData.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        }

        setCurrentChangeRankData(sortedData.slice(0, CHANGE_RANK_ITEMS_COUNT));
        setSortTypeForChangeRank(type);
    };


    const totalPages = Math.ceil(allChartData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentChartPageData = allChartData.slice(startIndex, endIndex); // 차트 테이블용 데이터

    const handleFavoriteClick = (e, stockName) => {
        e.stopPropagation();
        console.log(`${stockName} 찜 상태 변경됨`);
    };

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
            {/* 차트 테이블 헤더 */}
            

            <div className="table-container">
                {/* 차트 테이블 영역 */}
                <div className="chart-table">
                    <div className="chart-header">
                        <h2>차트</h2>
                        <div className="chart-rank-controls">
                            <button
                
                            >
                                KR
                            </button>
                            <button
                                
                            >
                                US
                            </button>
                        
                        </div>
                    </div>
                    <div style={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th className="rank-header"></th>
                                    <th>종목</th>
                                    <th>전일종가</th>
                                    <th>등락률</th>
                                    <th className="favorite-header"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentChartPageData.map((stock, index) => ( // currentChartPageData 사용
                                    <tr key={stock.ticker || stock.name} className="stock-row" onClick={() => handleStockRowClick(stock)}>
                                        <td className="rank-cell">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                        <td className="stock-name-cell">
                                            {stock.ticker && stock.ticker !== "티커 없음" && stock.ticker !== "오류" && (
                                                <img
                                                    src={stock.logo || `http://${IP}/logo/kr/${stock.ticker}`} // 객체에 저장된 로고 URL 사용
                                                    alt={`${stock.name} 로고`}
                                                    className="stock-logo"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            )}
                                            <span>{stock.name}</span>
                                        </td>
                                        <td>
                                            {typeof stock.price === 'number'
                                                ? `${stock.price.toLocaleString('ko-KR')}원`
                                                : stock.price}
                                        </td>
                                        <td className={stock.change >= 0 ? "positive" : "negative"}>
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                                        </td>
                                        <td className="favorite-cell">
                                            <span className="favorite-icon" onClick={(e) => handleFavoriteClick(e, stock.name)} title={`${stock.name} 찜하기`}>♥</span>
                                        </td>
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
                    {/* 변동순 테이블 헤더 (제목 및 버튼) */}
                    <div className="change-rank-header"> {/* 새롭게 추가된 헤더 컨테이너 */}
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
                    <table>
                        <thead>
                            <tr><th>종목</th><th>등락률</th><th className="favorite-header"></th></tr>
                        </thead>
                        <tbody>
                            {/* currentChangeRankData를 사용하여 변동순 테이블 표시 */}
                            {currentChangeRankData.map((stock) => (
                                <tr key={stock.ticker || stock.name} className="stock-row" onClick={() => handleStockRowClick(stock)}>
                                    <td className="stock-name-cell">
                                        {stock.ticker && (
                                            <img
                                                src={stock.logo || `http://${IP}/logo/kr/${stock.ticker}`} // 객체에 저장된 로고 URL 사용
                                                alt={`${stock.name} 로고`}
                                                className="stock-logo"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <span>{stock.name}</span>
                                    </td>
                                    <td className={stock.change >= 0 ? "positive" : "negative"}>
                                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                                    </td>
                                    <td className="favorite-cell">
                                        <span className="favorite-icon" onClick={(e) => handleFavoriteClick(e, stock.name)} title={`${stock.name} 찜하기`}>♥</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}