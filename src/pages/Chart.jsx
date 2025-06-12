// ChartPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MainLayout from '../components/MainLayout'; // 경로 확인 필요
import ChartSection from '../components/ChartSection'; // 경로 확인 필요
import API_CONFIG from '../config'; // config.jsx 파일의 상대 경로에 맞게 수정해주세요.

export default function ChartPage() {
    const { ticker } = useParams();
    const location = useLocation();

    const passedStockName = location.state?.stockName;
    const rawPassedStockPrice = location.state?.stockPrice;
    const passedStockChange = location.state?.stockChange;
    const passedStockType = location.state?.stockType; // Header.js에서 item.source가 여기에 전달됨

    const [stockName, setStockName] = useState(passedStockName || (ticker ? `종목 (${ticker})` : "종목 정보 로딩 중..."));
    const [stockPrice, setStockPrice] = useState("가격 정보 로딩 중...");
    const [stockChange, setStockChange] = useState(passedStockChange !== undefined ? passedStockChange : null);
    const [logoUrl, setLogoUrl] = useState('');
    const [stockCountryCode, setStockCountryCode] = useState('kr'); // 초기값은 'kr'로 유지

    useEffect(() => {
        // passedStockType을 기반으로 country를 결정합니다.
        // source 문자열의 앞 두 글자를 소문자로 변환하여 'kr'인지 확인합니다.
        const country = (passedStockType && passedStockType.toLowerCase().substring(0, 2) === 'kr') ? 'kr' : 'us';
        
        console.log("ChartPage useEffect 실행됨.");
        console.log("passedStockType (원본):", passedStockType);
        console.log("결정된 country:", country); // 디버깅용: 실제 결정된 country 값 확인

        setStockCountryCode(country); // 이 값을 상태로 저장

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
            console.log(`API_CONFIG.endpoints.stockDetails 호출 (country: ${country}, ticker: ${ticker})`); // API 호출 전 확인
            console.log(`최종 API 요청 URL: ${apiUrl}`); // 이 줄을 추가합니다.

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
    }, [ticker, passedStockName, rawPassedStockPrice, passedStockChange, passedStockType]); // passedStockType을 의존성 배열에 유지

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