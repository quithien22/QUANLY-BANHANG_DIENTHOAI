import React from 'react';
import "./App-admin.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';


import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import CpnLoginAdmin from "./pages/auth/login_admin";
import DashBoard from './pages/Dashboard/dashboard_admin';
import DanhMucSP from "./pages/sanpham/danhmucsp_admin"
import QuanLyDH from "./pages/donhang/quanlydh_admin"
import KhachHang from './pages/khachhang/khachhang_admin';
import NhanVien_PhanQuyen from "./pages/nhansu/nhanvien_phanquyen";
import NhaCungCap_PhieuNhap from "./pages/kho/nhacc_phieunhap";
import KhuyenMai from './pages/marketing/khuyenmai_admin';
import DanhGia from "./pages/khachhang/danhgia_admin";
import VanChuyen_Admin from './pages/donhang/vanchuyen_admin';
import CaiDatHeThong from './pages/hethong/caidathethong_admin';
import ChamCong from './pages/nhansu/chamcong_admin';
import SanPham from './pages/sanpham/sanpham_admin';
import DoiTraHang from './pages/donhang/doitrahang_admin';
import ThongKe from './pages/thongke/thongke_admin';
import Banner from './pages/marketing/banner_admin';
import HoTro from './pages/khachhang/hotro_admin';

 

function AdminContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login-admin';

  return (
    <div className="admin-layout-container">
      {!isLoginPage && <Sidebar />}

      <div className={isLoginPage ? "admin-main-full" : "admin-main"}>
        {!isLoginPage && <Topbar />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login-admin" />} />
            <Route path="/login-admin" element={<CpnLoginAdmin />} />
            <Route path="/admin/dashboard" element={<DashBoard />} />
            <Route path="/admin/danh-muc" element={<DanhMucSP />} />
            <Route path="/admin/quan_ly_don_hang" element={<QuanLyDH />} />
            <Route path="/admin/khach_hang" element={<KhachHang />} />
            <Route path="/admin/nhan_vien_phan_quyen" element={<NhanVien_PhanQuyen />} /> 
            <Route path="/admin/nhacungcap_phieunhap" element={<NhaCungCap_PhieuNhap/>} /> 
            <Route path="/admin/khuyen_mai" element={<KhuyenMai/>} /> 
            <Route path="/admin/danh_gia" element={<DanhGia/>} /> 
            <Route path="/admin/van_chuyen" element={<VanChuyen_Admin/>} /> 
            <Route path="/admin/cai_dat_he_thong" element={<CaiDatHeThong/>} /> 
            <Route path="/admin/cham_cong" element={<ChamCong/>} /> 
            <Route path="/admin/san_pham" element={<SanPham/>} /> 
            <Route path="/admin/doi_tra_hang" element={<DoiTraHang/>} /> 
            <Route path="/admin/thong_ke" element={<ThongKe/>} /> 
            <Route path="/admin/banner" element={<Banner/>} /> 
            <Route path="/admin/ho_tro" element={<HoTro/>} /> 
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AppAdmin() {
  return (
    <BrowserRouter>
      <AdminContent />
    </BrowserRouter>
  );
}