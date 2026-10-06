import React from 'react';
 // Đường dẫn import tùy thuộc vào cấu trúc thư mục của bạn
import DanhSachSanPhamTheoLoai from "./sanphamdienthoai";
function TrangSanPhamCuaToi() {
    return (
        <div>
            {/* Bạn bắt buộc phải truyền tieuDe và maLSP vào như thế này */}
            
            {/* Nếu muốn in danh sách Điện Thoại */}
            <DanhSachSanPhamTheoLoai tieuDe="ĐIỆN THOẠI" maLSP="LSP01" />

            {/* Nếu muốn in danh sách Máy Tính Bảng */}
            <DanhSachSanPhamTheoLoai tieuDe="MÁY TÍNH BẢNG" maLSP="LSP02" />
            
             {/* Nếu muốn in danh sách Phụ Kiện */}
            <DanhSachSanPhamTheoLoai tieuDe="PHỤ KIỆN" maLSP="LSP03" />
        </div>
    );
}

export default TrangSanPhamCuaToi;