import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';

import Header from './pages/home/header/Header';
import Login from './pages/login/login';
import Register from './pages/register/register';
import Support from './pages/hotro/support';
import Banner from './pages/home/banner/banner';
import SanPhamNoiBat from "./pages/home/danhmuc/spnoibat";
import Flashsale from "./pages/home/flashsale/FlashSale";
import SanPhamKhuyenMai from "./pages/home/flashsale/flashsale_page/spkhuyenmai";
import Footer from "./pages/footer/footer";
import TrangSanPhamCuaToi from "./pages/sanphamhome/trangsanpham";
import TrangLoaiSanPham from './pages/sanphamhome/trangloaisanpham';

import SanPhamCacHang from "./pages/sanpham/chitiethang";
import ChiTietSanPhamHang from './pages/sanpham/chitietsanpham/chitietsanpham';
import DanhGiaSanPhamSection from "./pages/sanpham/danhgia_page/danhgia";

import ThemGioHang from "./pages/thanhtoan/themgiohang/themvaogiohang";
import TienHanhDatHang from "./pages/thanhtoan/dathang/tienhanhdathang";
import ThanhToanThanhCong from "./pages/thanhtoan/ketqua/thanhtoanthanhcong";

import ThongTinkhachHang from './pages/taikhoan/taikhoan-khachhang/thongtinkhachhang';
import ChiTietDonHang from'./pages/donhang/chitietdonhang';
import SanPhamYeuThich from "./pages/taikhoan/taikhoan-khachhang/sanphamyeuthich/sanphamyeuthich";
import DoiTraHang from "./pages/taikhoan/taikhoan-khachhang/doitrahang/doitrahang";
import SuLyThanhTimKiem from "./pages/home/timkiem";
import TinCongNghe from './pages/tincongnghe/tincongnghe';
import DiaChiNhanHang from './pages/taikhoan/taikhoan-khachhang/diachinhanhang/diachinhanhang';
import LichSuMuaHang from './pages/taikhoan/taikhoan-khachhang/lichsumuahang/lichsumuahang';
import AiChatbot from './pages/chatbotAI/chatbotAI';



 


function Home() {
  return (
    <>
      <Banner />
      <SanPhamNoiBat />
      <Flashsale />
      <TrangSanPhamCuaToi/>
    </>
  );
}

// React Router không tự đưa trang về đầu khi đổi route: bấm "Xem chi tiết" ở cuối trang chủ/danh sách thì trang chi tiết
// giữ nguyên vị trí cuộn cũ và hiện luôn phần đánh giá ở cuối trang. Component này cuộn lên đầu mỗi khi đổi trang.
// Nếu URL có #anchor (vd #khu-vuc-danh-gia) thì để trình duyệt tự cuộn tới đó.
function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, search, hash]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' 
    || location.pathname === '/register' 
    || location.pathname === '/support';

  return (
    <div className="app-layout">
      <ScrollToTop />
      {!isAuthPage && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home/hang/:maThuongHieu" element={<SanPhamCacHang />} />
          <Route path="/home/hang/chi-tiet-san-pham/:id" element={<ChiTietSanPhamHang />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home/themgiohang" element={<ThemGioHang />} />
          <Route path="/home/themgiohang/tienhanhdathang" element={<TienHanhDatHang />} />
          {/* MoMo chuyển khách về đây sau khi thanh toán (MOMO_REDIRECT_URL, mặc định http://localhost:3000/thanh-toan-thanh-cong).
              Thiếu route này thì bị catch-all đá về /home và kết quả thanh toán không bao giờ được xác nhận. */}
          <Route path="/thanh-toan-thanh-cong" element={<ThanhToanThanhCong />} />
          <Route path="/home/tai-khoan" element={<ThongTinkhachHang />} />
          <Route path="/home/don-hang" element={<ChiTietDonHang />} />
          <Route path="/home/tim-kiem" element={<SuLyThanhTimKiem />} />
          <Route path="/home/san-pham-khuyen-mai" element={<SanPhamKhuyenMai />} />
          <Route path="/home/tai-khoan/san-pham-yeu-thich" element={<SanPhamYeuThich />} />
          <Route path="/home/hang/sanpham/danh-gia" element={<DanhGiaSanPhamSection />} />
          <Route path="/home/tai-khoan/doi-tra-hang" element={<DoiTraHang />} />
          <Route path="/home/tin-cong-nghe" element={<TinCongNghe />} />
          <Route path="/home/tai-khoan/dia-chi-nhan-hang" element={<DiaChiNhanHang />} />
          <Route path="/home/tai-khoan/lich-su-mua-hang" element={<LichSuMuaHang />} />
          <Route path="/home/danh-muc/:maLSP" element={<TrangLoaiSanPham />} />
           
          {/* Đường dẫn không tồn tại -> về /home */}
          <Route path="*" element={<Navigate to="/home" replace />} />




        </Routes>
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <AiChatbot />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}