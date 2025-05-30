import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MainLayout from '../components/MainLayout'; // 경로 확인 필요
import ChartSection from '../components/ChartSection'; // 경로 확인 필요
import API_CONFIG from '../config'; // config.jsx 파일의 상대 경로에 맞게 수정해주세요.

// const SERVER_IP = "192.168.0.18:5000/api"; // 이 줄은 삭제합니다.

export default function ChartPage() {
    const { ticker } = useParams();
    const location = useLocation();

    const passedStockName = location.state?.stockName;
    const rawPassedStockPrice = location.state?.stockPrice;
    const passedStockChange = location.state?.stockChange;
    const passedStockType = location.state?.stockType;

    const [stockName, setStockName] = useState(passedStockName || (ticker ? `종목 (${ticker})` : "종목 정보 로딩 중..."));
    const [stockPrice, setStockPrice] = useState("가격 정보 로딩 중...");
    const [stockChange, setStockChange] = useState(passedStockChange !== undefined ? passedStockChange : null);
    const [logoUrl, setLogoUrl] = useState('');
    const [stockCountryCode, setStockCountryCode] = useState('kr');

    useEffect(() => {
        const country = (passedStockType && passedStockType.toLowerCase() === 'kr') ? 'kr' : 'us';
        setStockCountryCode(country);

        if (passedStockName) {
            setStockName(passedStockName);
        } else if (ticker) {
            setStockName(`종목 (${ticker})`); // API 호출 후 stock_name으로 덮어쓸 수 있음
        } else {
            setStockName("종목 정보 로딩 중...");
        }

        if (ticker) {
            setLogoUrl(API_CONFIG.endpoints.stockLogo(country, ticker)); // API_CONFIG 사용
        } else {
            setLogoUrl('');
        }

        if (rawPassedStockPrice !== undefined && passedStockChange !== undefined) {
            let formattedPrice;
            if (typeof rawPassedStockPrice === 'number') {
                if (country === 'us') {
                    formattedPrice = `$${rawPassedStockPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                } else {
                    formattedPrice = `${rawPassedStockPrice.toLocaleString('ko-KR')}원`;
                }
            } else {
                formattedPrice = rawPassedStockPrice;
            }
            setStockPrice(formattedPrice);
            setStockChange(typeof passedStockChange === 'number' ? passedStockChange : null);
            console.log("StockTable에서 전달받은 정보 사용:", { name: passedStockName, price: formattedPrice, change: passedStockChange, type: country });
        } else if (ticker) {
            setStockPrice("가격 정보 로딩 중...");
            setStockChange(null);

            const apiUrl = API_CONFIG.endpoints.stockDetails(country, ticker); // API_CONFIG 사용
            console.log(`StockTable 정보 부재로 API 요청: ${apiUrl}`);

            fetch(apiUrl)
                .then(res => {
                    if (!res.ok) {
                        return res.text().then(text => { throw new Error(`네트워크 응답 오류: ${res.status} - ${text || '서버 오류'}`); });
                    }
                    return res.json();
                })
                .then(data => {
                    let formattedApiPrice = "정보 없음";
                    if (data.yesterday_close !== undefined && data.yesterday_close !== null) {
                        const priceValue = Number(data.yesterday_close);
                        if (country === 'us') {
                            formattedApiPrice = `$${priceValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        } else {
                            formattedApiPrice = `${priceValue.toLocaleString('ko-KR')}원`;
                        }
                    }
                    setStockPrice(formattedApiPrice);
                    setStockChange(data.change_rate !== undefined && data.change_rate !== null ? Number(data.change_rate) : null);
                    
                    if (!passedStockName && data.stock_name) { // API에서 받은 종목명으로 업데이트
                        setStockName(data.stock_name);
                    }
                })
                .catch(error => {
                    console.error('등락률/종가 API 호출 중 오류 발생:', error);
                    setStockPrice("정보 조회 실패");
                    setStockChange(null);
                });
        }
    }, [ticker, passedStockName, rawPassedStockPrice, passedStockChange, passedStockType]); // SERVER_IP를 의존성 배열에서 제거

    if (!ticker) {
        return (
            <MainLayout>
                <div>유효한 종목 티커가 없습니다.</div>
            </MainLayout>
        );
    }

    return (
        <ChartSection
            ticker={ticker}
            stockName={stockName}
            stockPrice={stockPrice}
            stockChange={stockChange}
            logoUrl={logoUrl}
            // chartServerIp prop에 API_CONFIG에서 정의한 차트 서버 호스트를 전달합니다.
            chartServerIp={API_CONFIG.CHART_IFRAME_SERVER_HOST}
            stockCountryCode={stockCountryCode}
        />
    );
}