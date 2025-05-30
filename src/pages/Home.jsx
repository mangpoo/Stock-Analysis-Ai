import React from 'react';
import StockTable from '../components/StockTable'; // 예시 컴포넌트
import NewsSection from '../components/NewsSection'; // 예시 컴포넌트

// MainLayout은 AppLayout이 관리하므로 제거합니다.
export default function Home() {
  return (
    <>
      <StockTable />
      <NewsSection /> 
    </>
  );
}