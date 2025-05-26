import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import ChartSection from '../components/ChartSection';

const SERVER_IP = "172.17.154.182:8080"; // 로고, 차트 iframe 및 등락률 API용 서버 IP

export default function ChartPage() {
    const { ticker } = useParams();
    const location = useLocation();

    // StockTable에서 전달받은 정보
    const passedStockName = location.state?.stockName;
    const passedStockPrice = location.state?.stockPrice; // StockTable에서 전달된 전일 종가
    const passedStockChange = location.state?.stockChange; // StockTable에서 전달된 등락률
    const passedStockSource = location.state?.stockSource; // StockTable에서 현재 전달되지 않지만, 다른 곳에서 받을 경우를 대비

    // ChartPage에서 관리할 상태들. passed 데이터를 우선적으로 사용합니다.
    const [stockName, setStockName] = useState(passedStockName || (ticker ? `종목 (${ticker})` : "종목 정보 로딩 중..."));
    const [stockPrice, setStockPrice] = useState(passedStockPrice !== undefined ? passedStockPrice : "가격 정보 로딩 중...");
    const [stockChange, setStockChange] = useState(passedStockChange !== undefined ? passedStockChange : null);
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        // 종목명 설정: 전달받은 이름이 있다면 사용, 없으면 티커로 임시 설정
        if (passedStockName) {
            setStockName(passedStockName);
        } else if (ticker) {
            //passedStockName이 없으면 티커로 기본값 설정
            setStockName(`종목 (${ticker})`); 
        } else {
            setStockName("종목 정보 로딩 중..."); // 티커도 없는 경우
        }

        // 로고 URL 설정 (항상 설정 시도)
        const countryCodeForLogo = passedStockSource && typeof passedStockSource === 'string' && passedStockSource.substring(0, 2).toUpperCase() === "US" ? 'us' : 'kr';
        if (ticker) {
            setLogoUrl(`http://${SERVER_IP}/logo/${countryCodeForLogo}/${ticker}`);
        } else {
            setLogoUrl('');
        }

        // 전일 종가 및 등락률 설정: StockTable에서 전달받은 정보가 있다면 사용, 없으면 API 호출
        if (passedStockPrice !== undefined && passedStockChange !== undefined) {
            setStockPrice(typeof passedStockPrice === 'number' ? `${passedStockPrice.toLocaleString('ko-KR')}원` : passedStockPrice);
            setStockChange(typeof passedStockChange === 'number' ? passedStockChange : null);
            console.log("StockTable에서 전달받은 정보 사용:", { name: passedStockName, price: passedStockPrice, change: passedStockChange });
        } else if (ticker) {
            // StockTable에서 정보가 전달되지 않았을 경우에만 API 호출
            setStockPrice("가격 정보 로딩 중...");
            setStockChange(null);

            const getCountryCode = (source) => {
                if (!source || typeof source !== 'string' || source.length < 2) {
                    console.warn("종목 출처(source) 정보가 유효하지 않아 'kr'로 기본 설정합니다. (StockTable은 KR 기반)");
                    return 'kr'; // StockTable이 KR 기반이므로 기본값을 'kr'로 설정
                }
                return source.substring(0, 2).toLowerCase();
            };

            const countryCode = getCountryCode(passedStockSource);
            const apiUrl = `http://${SERVER_IP}/changerate/${countryCode}/${ticker}`;
            console.log(`StockTable 정보 부재로 API 요청: ${apiUrl}`);

            fetch(apiUrl)
                .then(res => {
                    if (!res.ok) {
                        return res.text().then(text => { throw new Error(`네트워크 응답 오류: ${res.status} - ${text || '서버 오류'}`); });
                    }
                    return res.json();
                })
                .then(data => {
                    setStockPrice(data.yesterday_close !== undefined && data.yesterday_close !== null ? `${Number(data.yesterday_close).toLocaleString('ko-KR')}원` : "정보 없음");
                    setStockChange(data.change_rate !== undefined && data.change_rate !== null ? Number(data.change_rate) : null);
                    // StockName이 API 응답에 있다면 업데이트 (검색창을 통해 들어온 경우를 위해)
                    if (!passedStockName && data.stock_name) {
                        setStockName(data.stock_name);
                    }
                })
                .catch(error => {
                    console.error('등락률/종가 API 호출 중 오류 발생:', error);
                    setStockPrice("정보 조회 실패");
                    setStockChange(null);
                });
        }
    }, [ticker, passedStockName, passedStockPrice, passedStockChange, passedStockSource]); // 의존성 배열 업데이트

    if (!ticker) {
        return (
            <MainLayout>
                <div>유효한 종목 티커가 없습니다.</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <ChartSection
                ticker={ticker}
                stockName={stockName}
                stockPrice={stockPrice}
                stockChange={stockChange}
                logoUrl={logoUrl}
                chartServerIp={SERVER_IP}
            />
        </MainLayout>
    );
}