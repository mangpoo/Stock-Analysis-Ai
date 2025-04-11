import React from "react";
import "./StockTable.css";

export default function StockTable() {
  return (
    <div className="stock-table">
      <div className="title">
        <h2 className="title-1">차트</h2>
        <h2 className="title-2">변동 순</h2>
      </div>
      
      <div className="table-container">
        {/* 차트 테이블 */}
        <div className="chart-table">
          <table>
            <thead>
              <tr>
                <th>종목</th>
                <th>현재가</th>
                <th>등락률</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>HLB</td>
                <td>66,400원</td>
                <td className="negative">-7.6%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
              <tr>
                <td>삼성전자</td>
                <td>60,200원</td>
                <td className="positive">+2.9%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 세로선 */}
        <div className="vertical-line"></div>

        {/* 변동순 테이블 */}
        <div className="change-rank">
          <table>
            <thead>
              <tr>
                <th>종목</th>
                <th>등락률</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>카카오</td>
                <td className="negative">-3.5%</td>
              </tr>
              <tr>
                <td>네이버</td>
                <td className="positive">+4.2%</td>
              </tr>
              <tr>
                <td>네이버</td>
                <td className="positive">+4.2%</td>
              </tr>
              <tr>
                <td>LG에너지솔루션</td>
                <td className="negative">-1.8%</td>
              </tr>
              <tr>
                <td>네이버</td>
                <td className="positive">+4.2%</td>
              </tr>
              <tr>
                <td>LG에너지솔루션</td>
                <td className="negative">-1.8%</td>
              </tr>
              <tr>
                <td>LG에너지솔루션</td>
                <td className="negative">-1.8%</td>
              </tr>
              <tr>
                <td>LG에너지솔루션</td>
                <td className="negative">-1.8%</td>
              </tr>
              <tr>
                <td>네이버</td>
                <td className="positive">+4.2%</td>
              </tr>
              <tr>
                <td>네이버</td>
                <td className="positive">+4.2%</td>
              </tr>
              <tr>
                <td>네이버</td>
                <td className="positive">+4.2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
