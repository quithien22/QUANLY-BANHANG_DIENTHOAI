import React, { useState, useEffect } from "react";
import "./spkhuyenmai.css";
import axios from "axios";
import { Link } from "react-router-dom";

function SanPhamKhuyenMai() {
    const [danhSachKhuyenMai, setDanhSachKhuyenMai] = useState([]);

    const taiLaiDanhSachKhuyenMai = () => {
        axios.get("http://localhost:8080/api/user/khuyenmai")
            .then((response) => {
                const duLieu = Array.isArray(response.data)
                    ? response.data
                    : response.data?.data || response.data?.content || response.data?.items || [];
                setDanhSachKhuyenMai(Array.isArray(duLieu) ? duLieu : []);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiLaiDanhSachKhuyenMai();
    }, []);

    // ======== XỬ LÝ ĐẾM NGƯỢC THỜI GIAN ========
    const [danhSachKhungGio, setDanhSachKhungGio] = useState([]);
    const [khungGioActive, setKhungGioActive] = useState(null);
    const [thoiGianConLai, setThoiGianConLai] = useState("00 : 00 : 00");

    const formatGioHienThi = (timeStr) => {
        if (!timeStr) return "";
        // Cắt lấy giờ:phút (HH:MM)
        const match = timeStr.match(/(\d{2}:\d{2})/);
        return match ? match[1] : timeStr;
    };

    useEffect(() => {
        if (danhSachKhuyenMai.length > 0) {
            const uniqueSlots = [];
            const seen = new Set();

            danhSachKhuyenMai.forEach(sp => {
                if (sp.maKhungGio && !seen.has(sp.maKhungGio)) {
                    seen.add(sp.maKhungGio);
                    uniqueSlots.push({
                        maKhungGio: sp.maKhungGio,
                        gioBD: sp.gioBD,
                        gioKT: sp.gioKT,
                        trangThai: sp.trangThaiThucTe // Sửa thành biến mới từ SQL trả ra
                    });
                }
            });

            uniqueSlots.sort((a, b) => {
                const timeA = a.gioBD || "";
                const timeB = b.gioBD || "";
                return timeA.localeCompare(timeB);
            });

            setDanhSachKhungGio(uniqueSlots);

            if (!khungGioActive && uniqueSlots.length > 0) {
                // Sửa lại thành chuỗi Tiếng Việt do SQL sinh ra
                const dangDienRa = uniqueSlots.find(kg => kg.trangThai === "Đang diễn ra");
                setKhungGioActive(dangDienRa ? dangDienRa.maKhungGio : uniqueSlots[0].maKhungGio);
            }
        }
    }, [danhSachKhuyenMai]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!khungGioActive || danhSachKhungGio.length === 0) return;

            const slot = danhSachKhungGio.find(kg => kg.maKhungGio === khungGioActive);
            if (!slot || !slot.gioKT) return;

            const now = new Date();
            // Đã đổi Regex để bắt định dạng HH:MM cho phù hợp với kiểu VarChar mới
            const timeMatch = slot.gioKT.match(/(\d{2}):(\d{2})/); 
            if (!timeMatch) return;

            const thoiGianKT = new Date();
            thoiGianKT.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);

            const distance = thoiGianKT - now;

            if (distance <= 0) {
                setThoiGianConLai("00 : 00 : 00");
            } else {
                const h = String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, '0');
                const m = String(Math.floor((distance / 1000 / 60) % 60)).padStart(2, '0');
                const s = String(Math.floor((distance / 1000) % 60)).padStart(2, '0');
                setThoiGianConLai(`${h} : ${m} : ${s}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [khungGioActive, danhSachKhungGio]);


    //  ================ PHAN TRANG =========
   const soLuongMotTrang = 8;
    const [trangHienTai, setTrangHienTai] = useState(1);
 
    const slotDangChon = danhSachKhungGio.find(kg => kg.maKhungGio === khungGioActive);
    const laKhungGioDaKetThuc = slotDangChon && slotDangChon.trangThai === "Đã kết thúc";
 
    const sanPhamCuaKhungGio = laKhungGioDaKetThuc 
        ? [] 
        : danhSachKhuyenMai.filter(sp => sp.maKhungGio === khungGioActive);
 
    const tinhSoTrang = Math.ceil(sanPhamCuaKhungGio.length / soLuongMotTrang);
    const viTriBatDau = (trangHienTai - 1) * soLuongMotTrang;
    const sanPhamDangHien = sanPhamCuaKhungGio.slice(viTriBatDau, viTriBatDau + soLuongMotTrang);
 
    const danhSachTrang = Array.from({ length: tinhSoTrang }, (_, i) => i + 1);
    // ====================================================

    return (
        <div className="spflashsale-page">
            <div className="spflashsale-breadcrumb">
                <span className="spflashsale-breadcrumb_home">Trang chủ</span> &gt; <span className="spflashsale-breadcrumb_current">Flash sale giờ vàng</span>
            </div>

            <div className="spflashsale-timeslots">
                {danhSachKhungGio.map((kg, index) => {
                    let cssTrangThai = "spflashsale-timeslot--upcoming";
                    let textTrangThai = "Sắp diễn ra";

                    if (kg.trangThai === "Đang diễn ra") {
                        cssTrangThai = "spflashsale-timeslot--active";
                        textTrangThai = "Đang diễn ra";
                    } else if (kg.trangThai === "Đã kết thúc") {
                        cssTrangThai = "spflashsale-timeslot--done";
                        textTrangThai = "Đã diễn ra";
                    }

                    const isSelected = khungGioActive === kg.maKhungGio ? "selected-timeslot" : "";

                    return (
                        <button
                            key={index}
                            onClick={() => {
                                setKhungGioActive(kg.maKhungGio);
                                setTrangHienTai(1);
                            }}
                            className={`spflashsale-timeslot ${cssTrangThai} ${isSelected}`}
                            style={khungGioActive === kg.maKhungGio ? { border: '2px solid #e11b1e', opacity: 1 } : { opacity: 0.7 }}
                        >
                            <span className="spflashsale-timeslot_time">
                                {formatGioHienThi(kg.gioBD)} - {formatGioHienThi(kg.gioKT)}
                            </span>
                            <label className="spflashsale-timeslot_status">{textTrangThai}</label>
                        </button>
                    );
                })}
            </div>

            <div className="spflashsale-banner">
                <div className="spflashsale-banner_info">
                    <i className="bx bx-bolt-alt spflashsale-banner_icon" />
                    <div className="spflashsale-banner_text">
                        <span className="spflashsale-banner_title">GIỜ VÀNG CỰC SỐC - SĂN CHỚP NHOÁNG</span>
                        <span className="spflashsale-banner_desc">Số lượng có hạn, ưu đãi kết thúc sau khi hết thời gian hoặc hết quà tặng.</span>
                    </div>
                </div>

                <div className="spflashsale-countdown">
                    <span className="spflashsale-countdown_label">KẾT THÚC TRONG:</span>
                    <span className="spflashsale-countdown_timer">{thoiGianConLai}</span>
                </div>
            </div>

            <ul className="spflashsale-list">
                {sanPhamDangHien.length > 0 ? (
                    sanPhamDangHien.map((product, index) => (
                        <li className="spflashsale-card" key={product.maSP || index}>
                            <Link to={`/chitietsanpham/${product.maSP}`}>
                                <div className="spflashsale-card_imgwrap">
                                    {product.badge && <span className="spflashsale-badge">{product.badge}</span>}
                                    <img
                                        src={product.hinhAnh?.startsWith('http') ? product.hinhAnh : `http://localhost:8080${product.hinhAnh}`}
                                        alt={product.tenSP}
                                    />
                                </div>
                            </Link>

                            {product.tag && <span className="spflashsale-card_tag">{product.tag}</span>}

                            <Link to={`/chitietsanpham/${product.maSP}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h3 className="spflashsale-card_name">{product.tenSP}</h3>
                            </Link>

                            <div className="spflashsale-card_price">
                                <span className="spflashsale-price-new">
                                    {product.giaFlashSale ? product.giaFlashSale.toLocaleString('vi-VN') : 0}đ
                                </span>
                                <span className="spflashsale-price-old">
                                    {product.giaBan ? product.giaBan.toLocaleString('vi-VN') : 0}đ
                                </span>
                            </div>

                            <div className="spflashsale-card_rating">
                                <span>{product.diemDanhGiaTB}</span>
                                <i className="bx bxs-star"></i>
                                <span>({product.soLuongDanhGia || 0} đánh giá)</span>
                            </div>

                            <Link to={`/chi-tiet-san-pham/${product.maSP}`}>
                                <button className="spflashsale-card_btn">Xem chi tiết</button>
                            </Link>
                        </li>
                    ))
                ) : (
                    <div className="spflashsale-empty">
                        {/* Thay đổi icon và nội dung dựa theo việc khung giờ đã kết thúc hay chưa có sản phẩm */}
                        <i className={laKhungGioDaKetThuc ? "bx bx-time-five" : "bx bx-package"}></i>
                        <span>
                            {laKhungGioDaKetThuc 
                                ? "Khung giờ Flash Sale này đã kết thúc!" 
                                : "Chưa có sản phẩm nào trong khung giờ này."}
                        </span>
                        <p>
                            {laKhungGioDaKetThuc 
                                ? "Rất tiếc, các ưu đãi trong khung giờ này đã hết hạn. Vui lòng chọn khung giờ khác nhé!" 
                                : "Chương trình ưu đãi có thể chưa bắt đầu. Vui lòng quay lại sau nhé!"}
                        </p>
                    </div>
                )}
            </ul>

            {tinhSoTrang > 1 && (
                <div className="spflashsale-pagination">
                    <button
                        className="spflashsale-page_btn"
                        onClick={() => setTrangHienTai(trangHienTai - 1)}
                        disabled={trangHienTai === 1}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>

                    {danhSachTrang.map((soTrang) => (
                        <button
                            key={soTrang}
                            className={`spflashsale-page_btn ${trangHienTai === soTrang ? "active" : ""}`}
                            onClick={() => setTrangHienTai(soTrang)}
                        >
                            {soTrang}
                        </button>
                    ))}

                    <button
                        className="spflashsale-page_btn"
                        onClick={() => setTrangHienTai(trangHienTai + 1)}
                        disabled={trangHienTai === tinhSoTrang}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            )}
        </div>
    );
}

export default SanPhamKhuyenMai;