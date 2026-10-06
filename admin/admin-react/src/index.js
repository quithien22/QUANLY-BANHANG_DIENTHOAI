import React from 'react';
import ReactDOM from 'react-dom/client';
import AppAdmin from './App-admin'; // Gọi file Admin của bạn vào đây

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppAdmin /> 
  </React.StrictMode>
);