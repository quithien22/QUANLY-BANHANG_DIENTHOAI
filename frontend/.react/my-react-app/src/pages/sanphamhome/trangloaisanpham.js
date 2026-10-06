import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import "./trangloaisanpham.css";

function TrangLoaiSanPham() {
    // Lấy mã loại sản phẩm từ thanh địa chỉ URL
    const { maLSP } = useParams();
    const [danhSach, setDanhSach] = useState([]);
    const [trangHienTai, setTrangHienTai] = useState(1);


    // Khởi tạo state cho tính năng thả tim
    const [danhSachTym, setDanhSachTym] = useState([]);
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    // 1. Gọi API để kéo toàn bộ sản phẩm thuộc loại này
    useEffect(() => {
        axios.get(`http://localhost:8080/api/sanpham/loai-san-pham/${maLSP}`)
            .then(res => {
                const duLieu = Array.isArray(res.data) ? res.data : res.data?.data || [];
                setDanhSach(duLieu);
            })
            .catch(err => console.error("Lỗi:", err));
    }, [maLSP]);

    // 2. Gọi API lấy danh sách tim ban đầu
    useEffect(() => {
        if (maKH) {
            axios.get(`http://localhost:8080/api/yeuthich/${maKH}`)
                .then((response) => {
                    const mangMaSP = response.data.map(sp => sp.maSP);
                    setDanhSachTym(mangMaSP);
                })
                .catch(err => console.error("Lỗi tải danh sách tim:", err));
        }
    }, [maKH]);

    // 3. Hàm xử lý thả tim
    const xuLyTym = async (maSP) => {
        if (!maKH) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào mục Yêu thích!");
            return;
        }
        try {
            const res = await axios.post("http://localhost:8080/api/yeuthich/toggle", { maKH, maSP });
            if (res.data.success) {
                if (res.data.action === 'added') {
                    setDanhSachTym(prev => [...prev, maSP]);
                } else {
                    setDanhSachTym(prev => prev.filter(id => id !== maSP));
                }
            }
        } catch (error) {
            console.error("Lỗi khi thả tim:", error);
        }
    };

    // =================  PHÂN TRANG =================
    const soLuongMotTrang = 12;
    const tongSoTrang = Math.ceil(danhSach.length / soLuongMotTrang);
    const viTriBatDauTrang = (trangHienTai - 1) * soLuongMotTrang;
    const viTriHienThi = danhSach.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongMotTrang);
    const danhSachTrang = Array.from({ length: tongSoTrang }, (_, i) => i + 1);

    return (
        <div className="tlsp-container" >
            {/* Tạo grid 4 cột cho trang danh sách */}
            <div className="tlsp-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>

                {viTriHienThi.map((product, index) => {
                    const daTym = danhSachTym.includes(product.maSP);

                    return (
                        <div className="tlsp-card" key={product.maSP || index}>
                            <div className="tlsp-card_imgwrap">
                                {/* ICON TIM */}
                                <i
                                    className={`tlsp-heart bx ${daTym ? 'bxs-heart' : 'bx-heart'}`}
                                    onClick={() => xuLyTym(product.maSP)}
                                    style={{ color: daTym ? 'red' : 'inherit', cursor: 'pointer' }}
                                />

                                {product.badge && <span className="tlsp-badge">{product.badge}</span>}
                                <img src={product.hinhAnh?.startsWith('http') ? product.hinhAnh : `http://localhost:8080${product.hinhAnh}`} alt={product.tenSP} />
                            </div>

                            <span className="tlsp-card_tag-slot">
                                {product.tag && <span className="tlsp-card_tag">{product.tag}</span>}
                            </span>

                            <h3 className="tlsp-card_name">{product.tenSP}</h3>

                            <div className="tlsp-card_price">
                                <span className="price-new">
                                    {product.giaBan ? product.giaBan.toLocaleString('vi-VN') : 0}đ
                                </span>
                            </div>

                            <div className="tlsp-card_rating">
                                <span>{product.diemDanhGiaTB ? Number(product.diemDanhGiaTB).toFixed(1) : "0.0"}</span>
                                <i className="bx bxs-star" style={{ color: '#fbbf24', margin: '0 4px' }}></i>
                                <span>({product.soLuongDanhGia || 0} đánh giá)</span>
                            </div>

                            <Link to={`/chi-tiet-san-pham/${product.maSP}`}>
                                <button className="tlsp-card_btn">Xem chi tiết</button>
                            </Link>

                        </div>
                    );
                })}

               
                    <div className="tlsp-pagination-container">
                       
                        <div className="tlsp-pagination-controls">
                            <button
                                className="tlsp-pagination-btn"
                                onClick={() => setTrangHienTai(trangHienTai - 1)}
                                disabled={trangHienTai === 1}
                            >
                                <i className="bx bx-chevron-left"></i>
                            </button>

                            {danhSachTrang.map((soTrang) => (
                                <button
                                    key={soTrang}
                                    className={`tlsp-pagination-btn ${trangHienTai === soTrang ? "active" : ""}`}
                                    onClick={() => setTrangHienTai(soTrang)}
                                >
                                    {soTrang}
                                </button>
                            ))}

                            <button
                                className="tlsp-pagination-btn"
                                onClick={() => setTrangHienTai(trangHienTai + 1)}
                                disabled={trangHienTai === tongSoTrang || tongSoTrang === 0}
                            >
                                <i className="bx bx-chevron-right"></i>
                            </button>
                        </div>
                    </div>
           


            </div>
        </div>
    );
}

export default TrangLoaiSanPham;