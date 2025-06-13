import React, { useState, useCallback, useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import './AppLayout.css';
import API_CONFIG from '../config';

function AppLayout({ children }) {
  const [panelType, setPanelType] = useState(null);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [recentStocks, setRecentStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const jwtToken = localStorage.getItem('jwt_token');
  const navigate = useNavigate();

  // Add a useEffect to monitor jwtToken changes
  useEffect(() => {
    // If jwtToken becomes null (user logs out), clear the stock lists
    if (!jwtToken) {
      setFavoriteStocks([]);
      setRecentStocks([]);
    }
  }, [jwtToken]); // Depend on jwtToken

  const fetchStockDetail = async (ticker) => {
    try {
      const searchResponse = await fetch(API_CONFIG.endpoints.search(ticker));
      if (!searchResponse.ok) throw new Error(`Search failed for ${ticker}`);
      const searchData = await searchResponse.json();

      const stockName = searchData && searchData.length > 0 ? searchData[0].name : ticker;
      const stockType = /^\d+$/.test(ticker) ? 'kr' : 'us';
      const logoUrl = API_CONFIG.endpoints.stockLogo(stockType, ticker);

      let displayName = stockName;

      // If it's a US stock, try to fetch its Korean name
      if (stockType === 'us') {
        try {
          const krNameResponse = await fetch(API_CONFIG.endpoints.getKrName(ticker));
          if (krNameResponse.ok) {
            const krNameData = await krNameResponse.json();
            if (krNameData && krNameData.name && krNameData.name !== "N/A") {
              displayName = krNameData.name;
            }
          }
        } catch (krNameError) {
          console.warn(`Failed to fetch Korean name for ${ticker}:`, krNameError);
          // Fallback to original stockName if Korean name fetching fails
        }
      }

      return {
        ticker: ticker,
        name: stockName, // Original name from search
        displayName: displayName, // Name to display (Korean if available, else original)
        logo: logoUrl,
        stockType: stockType,
      };

    } catch (error) {
      console.error(`Failed to fetch details for ${ticker}:`, error);
      const stockType = /^\d+$/.test(ticker) ? 'kr' : 'us';
      return {
        ticker: ticker,
        name: ticker,
        displayName: ticker, // Fallback display name
        logo: API_CONFIG.endpoints.stockLogo(stockType, 'default'),
        stockType: stockType,
      };
    }
  };


  // 관심 종목 삭제 함수
  const deleteFavorite = async (ticker) => {
    if (!jwtToken) return;
    try {
      const response = await fetch("https://ddolddol2.duckdns.org/api/favorite", {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ stock_code: ticker })
      });
      if (response.ok) {
        setFavoriteStocks(prev => prev.filter(stock => stock.ticker !== ticker));
        console.log(`✅ ${ticker} 삭제됨`);
      } else {
        const errText = await response.text();
        console.warn(`❌ 삭제 실패: ${errText}`);
      }
    } catch (err) {
      console.error("❌ 관심 종목 삭제 중 오류:", err);
    }
  };


  const fetchSidePanelData = useCallback(async (type) => {
    // Only fetch if jwtToken exists
    if (!jwtToken) {
      // If no token, ensure lists are empty and return early
      if (type === 'favorite') setFavoriteStocks([]);
      if (type === 'recent') setRecentStocks([]);
      return;
    }

    const endpoint = type === 'favorite' ? 'favorite' : 'recent';
    const setState = type === 'favorite' ? setFavoriteStocks : setRecentStocks;
    setLoading(true);

    try {
      const tickerResponse = await fetch(`https://ddolddol2.duckdns.org/api/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      if (!tickerResponse.ok) throw new Error('Failed to fetch ticker list');
      const tickers = await tickerResponse.json();

      if (Array.isArray(tickers) && tickers.length > 0) {
        const detailedStockPromises = tickers.map(ticker => fetchStockDetail(ticker));
        const detailedStocks = await Promise.all(detailedStockPromises);
        setState(detailedStocks);
      } else {
        setState([]);
      }
    } catch (err) {
      console.error(`❌ ${type} 목록 불러오기 실패:`, err);
      setState([]);
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  const togglePanel = (type) => {
    if (panelType === type) {
      setPanelType(null);
    } else {
      setPanelType(type);
      // Only fetch if JWT token exists
      if (jwtToken) {
        fetchSidePanelData(type);
      } else {
        // If no JWT token, immediately clear the state for the opened panel type
        if (type === 'favorite') setFavoriteStocks([]);
        if (type === 'recent') setRecentStocks([]);
      }
    }
  };

  const handleStockClick = (stock) => {
    if (!stock || !stock.ticker) return;

    navigate(`/chart/${stock.ticker}`, {
      state: {
        stockName: stock.displayName, // Use displayName for navigation state
        stockType: stock.stockType,
      }
    });

    closePanel();
  };

  const closePanel = () => setPanelType(null);
  const isPanelOpen = panelType !== null;

  const renderStockList = (stocks, type) => {
    if (loading) return <p>로딩 중...</p>;
    // Only show "목록이 없습니다." if not loading and stocks are empty
    if (!loading && stocks.length === 0) return <p>목록이 없습니다.</p>;

    return (
      <ul>
        {stocks.map((stock) => (
          <li
            key={`${type}-${stock.ticker}`}
            className="stock-list-item-custom"
            onClick={() => handleStockClick(stock)}
          >
            <img src={stock.logo} alt={`${stock.displayName} logo`} className="stock-logo" />
            <div className="stock-info">
              <span className="stock-name" style={{ fontSize: '15px' }}>{stock.displayName}</span>
              <span className="stock-ticker">{stock.ticker}</span>
            </div>

            {type === 'favorite' && (
              <button
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation(); // 종목 클릭 이벤트 방지
                  deleteFavorite(stock.ticker);
                }}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="app-container">
      <MainLayout
        onFavoriteClick={() => togglePanel('favorite')}
        onRecentClick={() => togglePanel('recent')}
        isPanelOpen={isPanelOpen}
      >
        {children}
      </MainLayout>

      <div className={`side-panel favorite-panel ${panelType === 'favorite' ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>관심 종목</h2>
          <button onClick={closePanel} className="close-button">X</button>
        </div>
        <div className="panel-content">
          {renderStockList(favoriteStocks, 'favorite')}
        </div>
      </div>

      <div className={`side-panel recent-panel ${panelType === 'recent' ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>최근 본 종목</h2>
          <button onClick={closePanel} className="close-button">X</button>
        </div>
        <div className="panel-content">
          {renderStockList(recentStocks, 'recent')}
        </div>
      </div>
    </div>
  );
}

export default AppLayout;