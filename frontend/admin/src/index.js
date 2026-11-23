import React from 'react';
import ReactDOM from 'react-dom/client';
import AppAdmin from './App-admin'; // Gọi file Admin của bạn vào đây
import './utils/authInterceptor'; // gắn JWT vào axios toàn cục (nhiều trang admin gọi thẳng axios tới backend)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppAdmin /> 
  </React.StrictMode>
);