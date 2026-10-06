import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import "./timkiem.css";


function SuLyTimKiem() {
    // State lưu kết quả từ API database
    const [danhSachKetQua, setDanhSachKetQua] = useState([]);
    const [dangTai, setDangTai] = useState(false);
    const [locDanhMuc, setLocDanhMuc] = useState([]);
    const [locGia, setLocGia] = useState("tat-ca");

    // Lấy query param 'q' từ URL (ví dụ: /tim-kiem?q=iphone)
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const tuKhoa = queryParams.get("q") || "";

    // LOAD API TIM KIEM
    useEffect(() => {
        if (!tuKhoa.trim()) {
            setDanhSachKetQua([]);
            return;
        }

        setDangTai(true);
        setViTriHienTai(0);
        axios.get(`http://localhost:8080/api/sanpham/tim-kiem?tuKhoa=${encodeURIComponent(tuKhoa)}`)
            .then((response) => {
                setDanhSachKetQua(response.data);
            })
            .catch((error) => {
                console.error("Lỗi tìm kiếm sản phẩm:", error);
            })
            .finally(() => {
                setDangTai(false);
            });
    }, [tuKhoa]);

    const [sanPhamGoiY, setSanPhamGoiY] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8080/api/sanpham ")
            .then((response) => {
                // Chỉ lấy 3 sản phẩm đầu tiên 
                const duLieu = Array.isArray(response.data) ? response.data : [];
                setSanPhamGoiY(duLieu.slice(0, 3));
            })
            .catch((error) => console.error("Lỗi lấy sản phẩm gợi ý:", error));
    }, []);


    // ====================== DINH DANG TIEN ===================
    const dinhDangTien = (tien) => `${(Number(tien) || 0).toLocaleString("vi-VN")}đ`;


    // ======================= XU LY BO LOC ===========================
    const danhSachLoaiHienCo = [...new Set(danhSachKetQua.map(sp => sp.tenLSP).filter(Boolean))];
    useEffect(() => {
        setViTriHienTai(0);
        setLocDanhMuc([]);
        setLocGia("tat-ca");
    }, [tuKhoa]);

    // Bắt sự kiện chọn/bỏ chọn checkbox Danh mục
    const xuLyChonDanhMuc = (loai) => {
        if (loai === "tat-ca") {
            setLocDanhMuc([]); 
            return;
        }
        setLocDanhMuc(prev =>
            prev.includes(loai) ? prev.filter(l => l !== loai) : [...prev, loai]
        );
    };

    const danhSachKetQuaDaLoc = danhSachKetQua.filter((sp) => {
        //   Lọc theo Danh mục
        const khopDanhMuc = locDanhMuc.length === 0 || locDanhMuc.includes(sp.tenLSP);

        //  Lọc theo khoảng giá
        let khopGia = true;
        const giaSP = Number(sp.giaBan) || 0;
        if (locGia === "duoi-10") khopGia = giaSP < 10000000;
        else if (locGia === "10-20") khopGia = giaSP >= 10000000 && giaSP <= 20000000;
        else if (locGia === "tren-20") khopGia = giaSP > 20000000;

        return khopDanhMuc && khopGia; 
    });

    // ==== KHI KHACH HANG BAM VAO BO LOC ============== 
    useEffect(() => {
        setViTriHienTai(0);
    }, [locDanhMuc, locGia]);

    // ===  PHÂN TRANG   ===
    const [viTriHienTai, setViTriHienTai] = useState(0);
    const soLuongHienThi = 3;
    const viTriTruot = Math.max(0, danhSachKetQuaDaLoc.length - soLuongHienThi); // Đổi thành danhSachKetQuaDaLoc

    const nutTien = () => {
        setViTriHienTai((prev) => prev >= viTriTruot ? viTriTruot : prev + 1);
    };

    const nutLui = () => {
        setViTriHienTai((prev) => prev <= 0 ? 0 : prev - 1);
    };

    // Đổi thành danhSachKetQuaDaLoc
    const ketQuaDangHien = danhSachKetQuaDaLoc.slice(viTriHienTai, viTriHienTai + soLuongHienThi);
    return (
        <div className="timkiem-page">
            <div className="timkiem-breadcrumb">
                <Link to="/home">
                    <span className="timkiem-breadcrumb_link">Trang chủ</span>
                </Link>

                &gt;
                <span className="timkiem-breadcrumb_current">Tìm kiếm</span>
            </div>

            <div className="timkiem-header_box">
                <ul className="timkiem-header_list">
                    <li className="timkiem-header_title">KẾT QUẢ CHO TỪ KHÓA: "{tuKhoa}"</li>
                    <li className="timkiem-header_message">
                        {danhSachKetQua.length === 0 && !dangTai && (
                            <p className="timkiem-header_warning">
                                Không tìm thấy kết quả trực tiếp cho "{tuKhoa}". Bạn có thể tham khảo các dòng sản phẩm gợi ý bên dưới.
                            </p>
                        )}
                        {dangTai && <p className="timkiem-header_warning">Đang tải dữ liệu tìm kiếm...</p>}
                    </li>
                    <li className="timkiem-header_tags">
                        <span className="timkiem-header_tags_label">Từ khóa phổ biến:</span>
                        <Link to="/tim-kiem?q=iPhone"><button className="timkiem-header_tag_btn">iPhone</button></Link>
                        <Link to="/tim-kiem?q=Samsung"><button className="timkiem-header_tag_btn">Samsung</button></Link>
                        <Link to="/tim-kiem?q=Xiaomi"><button className="timkiem-header_tag_btn">Xiaomi</button></Link>
                    </li>
                </ul>
            </div>

            <div className="timkiem-body_container">
                <ul className="timkiem-layout">
                    {/* CỘT TRÁI: LỌC SẢN PHẨM */}
                    <li className="timkiem-sidebar">
                        <h3 className="timkiem-sidebar_title">LỌC SẢN PHẨM</h3>
                        
                        <div className="timkiem-filter_group">
                            <span className="timkiem-filter_label">Danh mục</span>
                            <label className="timkiem-filter_item">
                                <input 
                                    type="checkbox" 
                                    className="timkiem-filter_input" 
                                    checked={locDanhMuc.length === 0}
                                    onChange={() => xuLyChonDanhMuc("tat-ca")}
                                /> Tất cả
                            </label>
                          
                            {danhSachLoaiHienCo.map(loai => (
                                <label key={loai} className="timkiem-filter_item">
                                    <input 
                                        type="checkbox" 
                                        className="timkiem-filter_input"
                                        checked={locDanhMuc.includes(loai)}
                                        onChange={() => xuLyChonDanhMuc(loai)}
                                    /> {loai}
                                </label>
                            ))}
                        </div>

                        <div className="timkiem-filter_group">
                            <span className="timkiem-filter_label">Khoảng giá</span>
                            <label className="timkiem-filter_item">
                                <input type="radio" name="gia" value="tat-ca" className="timkiem-filter_input" checked={locGia === "tat-ca"} onChange={(e) => setLocGia(e.target.value)} /> Tất cả mức giá
                            </label>
                            <label className="timkiem-filter_item">
                                <input type="radio" name="gia" value="duoi-10" className="timkiem-filter_input" checked={locGia === "duoi-10"} onChange={(e) => setLocGia(e.target.value)} /> Dưới 10 triệu
                            </label>
                            <label className="timkiem-filter_item">
                                <input type="radio" name="gia" value="10-20" className="timkiem-filter_input" checked={locGia === "10-20"} onChange={(e) => setLocGia(e.target.value)} /> 10 triệu - 20 triệu
                            </label>
                            <label className="timkiem-filter_item">
                                <input type="radio" name="gia" value="tren-20" className="timkiem-filter_input" checked={locGia === "tren-20"} onChange={(e) => setLocGia(e.target.value)} /> Trên 20 triệu
                            </label>
                        </div>
                    </li>

                    {/* CỘT PHẢI: KẾT QUẢ TÌM KIẾM */}
                    <li className="timkiem-main">
                        <div className="timkiem-results">
                            {danhSachKetQua.length === 0 && !dangTai ? (
                                <div className="timkiem-empty">
                                    <i className="bx bx-search-alt"></i>
                                    <h3 className="timkiem-empty_title">Không tìm thấy kết quả chính xác cho "{tuKhoa}"</h3>
                                    <p className="timkiem-empty_desc">Vui lòng kiểm tra lại chính tả từ khóa hoặc thử tìm kiếm với các từ khóa phổ biến.</p>
                                </div>
                            ) : (
                                <div className="timkiem-slider-wrap">
                                    {danhSachKetQua.length > soLuongHienThi && (
                                        <button
                                            className="timkiem-nav timkiem-nav-prev"
                                            onClick={nutLui}
                                            disabled={viTriHienTai === 0}
                                        >
                                            <i className="bx bx-chevron-left"></i>
                                        </button>
                                    )}

                                    <ul className="timkiem-grid">
                                        {ketQuaDangHien.map((sp, i) => (
                                            <li key={i} className="timkiem-card">
                                                <div className="timkiem-card_imgwrap">
                                                    <img
                                                        src={sp.hinhAnh?.startsWith('http') ? sp.hinhAnh : `http://localhost:8080${sp.hinhAnh}`}
                                                        alt={sp.tenSP}
                                                    />
                                                </div>
                                                <h3 className="timkiem-card_name">{sp.tenSP}</h3>
                                                <div className="timkiem-card_price">
                                                    <span className="price-new">{dinhDangTien(sp.giaBan)}</span>
                                                </div>
                                                <Link to={`/chi-tiet-san-pham/${sp.maSP}`}>
                                                    <button className="timkiem-card_btn">Xem chi tiết</button>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>

                                    {danhSachKetQua.length > soLuongHienThi && (
                                        <button
                                            className="timkiem-nav timkiem-nav-next"
                                            onClick={nutTien}
                                            disabled={viTriHienTai === viTriTruot}
                                        >
                                            <i className="bx bx-chevron-right"></i>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* GỢI Ý — SẢN PHẨM KHÁC ĐANG ĐƯỢC QUAN TÂM */}
                            <h3 className="timkiem-goiy-title">SẢN PHẨM KHÁC ĐANG ĐƯỢC QUAN TÂM</h3>
                            <ul className="timkiem-grid">
                                {sanPhamGoiY.map((sp, i) => (
                                    <li key={sp.maSP || i} className="timkiem-card">
                                        <div className="timkiem-card_imgwrap">
                                            <img
                                                src={sp.hinhAnh?.startsWith('http') ? sp.hinhAnh : `http://localhost:8080${sp.hinhAnh}`}
                                                alt={sp.tenSP}
                                            />
                                        </div>
                                        <h3 className="timkiem-card_name">{sp.tenSP}</h3>
                                        <div className="timkiem-card_price">
                                            <span className="price-new">{dinhDangTien(sp.giaBan)}</span>
                                        </div>

                                        {/* Gắn luôn link để khách bấm vào là sang trang chi tiết */}
                                        <Link to={`/chi-tiet-san-pham/${sp.maSP}`}>
                                            <button className="timkiem-card_btn">Xem chi tiết</button>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default SuLyTimKiem;