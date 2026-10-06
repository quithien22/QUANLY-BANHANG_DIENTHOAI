import React, { useState, useEffect } from "react";
import "./sanphamyeuthich.css";
import { Link } from "react-router-dom";
import axios from "axios";

function SanPhamYeuThich() {
    const [danhSachYeuThich, setDanhSachYeuThich] = useState([]);
    const [dangTai, setDangTai] = useState(true);

    // LẤY THÔNG TIN KHÁCH HÀNG TỪ LOCAL STORAGE
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    // GỌI API LẤY SẢN PHẨM YÊU THÍCH KHI TRANG LOAD
    useEffect(() => {
        if (!maKH) {
            setDangTai(false);
            return;
        }

        axios.get(`http://localhost:8080/api/yeuthich/${maKH}`)
            .then(res => {
                setDanhSachYeuThich(res.data);
                setDangTai(false);
            })
            .catch(err => {
                console.error("Lỗi lấy danh sách yêu thích:", err);
                setDangTai(false);
            });
    }, [maKH]);

    // HÀM XÓA KHỎI DANH SÁCH YÊU THÍCH (NÚT THÙNG RÁC)
    const xoaYeuThich = async (maSP) => {
        try {
            const res = await axios.post("http://localhost:8080/api/yeuthich/toggle", { maKH, maSP });
            if (res.data.success && res.data.action === 'removed') {
                // Cập nhật lại UI lập tức bằng cách lọc bỏ sản phẩm vừa xóa
                setDanhSachYeuThich(prev => prev.filter(sp => sp.maSP !== maSP));
            }
        } catch (error) {
            console.error("Lỗi khi xóa yêu thích:", error);
        }
    };

    const dinhDangTien = (tien) => `${(Number(tien) || 0).toLocaleString("vi-VN")}đ`;

    if (!maKH) {
        return (
            <div className="spyeuthich-page" style={{ textAlign: "center", padding: "50px" }}>
                <h3>Vui lòng đăng nhập để xem danh sách Yêu thích của bạn!</h3>
                <Link to="/dangnhap" style={{ color: "blue", textDecoration: "underline" }}>Đến trang Đăng nhập</Link>
            </div>
        );
    }

    return (
        <div className="spyeuthich-page">
            <div className="spyeuthich-breadcrumb">
                <Link to="/home"><span className="spyeuthich-breadcrumb_home">Trang chủ</span></Link>
                &gt;
                <Link to="/tai-khoan"><span className="spyeuthich-breadcrumb_link">Tài khoản</span></Link>
                &gt;
                <span className="spyeuthich-breadcrumb_current">Sản phẩm yêu thích</span>
            </div>

            <div className="spyeuthich-header">
                <span className="spyeuthich-header_title">SẢN PHẨM YÊU THÍCH CỦA BẠN ({danhSachYeuThich.length})</span>
                <label className="spyeuthich-header_note">Nhận thông báo tự động khi sản phẩm yêu thích được giảm giá sâu hoặc có chương trình khuyến mãi bất ngờ</label>
            </div>

            {dangTai ? (
                <p>Đang tải danh sách...</p>
            ) : danhSachYeuThich.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <i className='bx bx-heart' style={{ fontSize: "50px", color: "#ccc" }}></i>
                    <p>Bạn chưa có sản phẩm yêu thích nào.</p>
                </div>
            ) : (
                <ul className="spyeuthich-list">
                    {danhSachYeuThich.map((product) => (
                        <li className="spyeuthich-card" key={product.maSP}>
                            <div className="spyeuthich-card_imgwrap">
                                <img 
                                    src={product.hinhAnh?.startsWith('http') ? product.hinhAnh : `http://localhost:8080${product.hinhAnh}`} 
                                    alt={product.tenSP} 
                                />
                            </div>
                            
                            {product.tag && <span className="spyeuthich-card_tag">{product.tag}</span>}
                            
                            <h3 className="spyeuthich-card_name">{product.tenSP}</h3>
                            
                            <div className="spyeuthich-card_price">
                                <span className="spyeuthich-price-new">{dinhDangTien(product.giaBan)}</span>
                                {/* Nếu có giá cũ (ví dụ: giá gốc trước flash sale), render ở đây */}
                            </div>
                            
                            <div className="spyeuthich-btn"> 
                                <Link to={`/chitietsanpham/${product.maSP}`} style={{ width: '100%' }}>
                                    <button className="spyeuthich-card_btn">Xem & Mua ngay</button>
                                </Link>
                                <button className="spyeuthich-card_remove" onClick={() => xoaYeuThich(product.maSP)}>
                                    <i className="bx bx-trash-alt" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SanPhamYeuThich;