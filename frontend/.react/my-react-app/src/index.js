import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Kiểm tra "Ghi nhớ đăng nhập": nếu không tick và là phiên trình duyệt mới thì xóa thông tin đăng nhập
try {
  const conGhiNho = localStorage.getItem("ghiNhoDangNhap") === "1";
  const phienHienTai = sessionStorage.getItem("phienDangNhap") === "1";
  if (!conGhiNho && !phienHienTai) {
    localStorage.removeItem("userData");
  }
} catch (e) {
  console.error(e);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
