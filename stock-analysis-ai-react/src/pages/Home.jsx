import React from 'react';
import MainLayout from '../components/MainLayout';
import StockTable from '../components/StockTable';
import NewsSection from '../components/NewsSection';

export default function Home() {
  return (
    <MainLayout>
      <StockTable />
      <NewsSection />
    </MainLayout>
  );
}
