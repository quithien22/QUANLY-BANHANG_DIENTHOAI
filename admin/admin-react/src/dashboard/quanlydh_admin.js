import React, { useState, useEffect } from "react";
import axios from "axios";
import "./quanlyhd_admin.css";

function QuanLyDonHang() {
    const [trangThaiDangChon, setTrangThaiDangChon] = useState("Tất cả");
    const [danhSachHoaDon, setDanhSachHoaDon] = useState([]);

    // State bổ sung cho Tìm kiếm và Lọc ngày
    const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState("");
    const [tuNgay, setTuNgay] = useState("");
    const [denNgay, setDenNgay] = useState("");

    // =================== STATE THONG BAO DUNG , SAI ====================
    const [thongBaoToast, setThongBaoToast] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoToast(noiDung);
        setTimeout(() => {
            setThongBaoToast(null);
        }, 3000);
    };

    useEffect(() => {
        axios.get("http://localhost:8080/api/hoadon/toanbo")
            .then((response) => {
                setDanhSachHoaDon(response.data);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    }, []);

    const tabs = [
        { label: "Tất cả", key: "tat-ca" },
        { label: "Chờ xác nhận", key: "cho-xac-nhan" },
        { label: "Đã xác nhận", key: "da-xac-nhan" },  
        { label: "Đang giao", key: "dang-giao" },
        { label: "Hoàn tất", key: "hoan-tat" },
        { label: "Đã hủy", key: "da-huy" },
    ];

    const formatTrangThai = (tt) => {
        const map = {
            "cho_xac_nhan": { text: "Chờ xác nhận", css: "cho-xac-nhan" },
            "xac_nhan": { text: "Đã xác nhận", css: "da-xac-nhan" },
            "dang_giao": { text: "Đang giao", css: "dang-giao" },
            "hoan_tat": { text: "Hoàn tất", css: "hoan-tat" },
            "da_huy": { text: "Đã hủy", css: "da-huy" }
        };
        return map[tt] || { text: tt, css: "" };
    };

    const demSoLuong = (label) => {
        if (label === "Tất cả") return danhSachHoaDon.length;
        return danhSachHoaDon.filter(dh => formatTrangThai(dh.trangThai).text.toLowerCase() === label.toLowerCase()).length;
    };

    // --- LOGIC LỌC KẾT HỢP: TRẠNG THÁI , TỪ KHÓA ,KHOẢNG NGÀY ---
    const donHangHienThi = danhSachHoaDon.filter(dh => {
        // 1. Lọc theo trạng thái Tab
        const matchTrangThai = trangThaiDangChon === "Tất cả" ||
            formatTrangThai(dh.trangThai).text.toLowerCase() === trangThaiDangChon.toLowerCase();

        //  Lọc theo từ khóa (Mã hóa đơn hoặc Tên khách hàng)
        const keyword = tuKhoaTimKiem.toLowerCase();
        const matchTuKhoa =
            String(dh.maHoaDon).toLowerCase().includes(keyword) ||
            (dh.hoTen && dh.hoTen.toLowerCase().includes(keyword));

        //  Lọc theo khoảng ngày lập
        let matchNgay = true;
        const ngayLapDon = new Date(dh.thoiGianLap).setHours(0, 0, 0, 0);
        if (tuNgay) {
            const start = new Date(tuNgay).setHours(0, 0, 0, 0);
            if (ngayLapDon < start) matchNgay = false;
        }
        if (denNgay) {
            const end = new Date(denNgay).setHours(0, 0, 0, 0);
            if (ngayLapDon > end) matchNgay = false;
        }

        return matchTrangThai && matchTuKhoa && matchNgay;
    });

    const soLuongDonHangMotTrang = 10;
    const [trangThaiDonHang, setTrangThaiDonHang] = useState(1);
    const tinhSoDonHangMotTrang = Math.ceil(donHangHienThi.length / soLuongDonHangMotTrang);
    const viTriBatDauTrang = (trangThaiDonHang - 1) * soLuongDonHangMotTrang;

    const sanPhamDangHienDonHang = donHangHienThi.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongDonHangMotTrang);
    const danhSachTrangDonHang = Array.from({ length: tinhSoDonHangMotTrang }, (_, i) => i + 1);

    const [donHangDangXem, setDonHangDangXem] = useState(null);

    const handleCapNhatTrangThai = async (maHoaDon, trangThaiMoi) => {
        try {
            const response = await axios.put(`http://localhost:8080/api/hoadon/capnhat-trangthai/${maHoaDon}`, {
                trangThai: trangThaiMoi
            });
            if (response.data.success) {
                hienThiThongBao("Cập nhật trạng thái thành công!");
                setDanhSachHoaDon(prevList =>
                    prevList.map(dh => dh.maHoaDon === maHoaDon ? { ...dh, trangThai: trangThaiMoi } : dh)
                );
                if (donHangDangXem && donHangDangXem.maHoaDon === maHoaDon) {
                    setDonHangDangXem(prev => ({ ...prev, trangThai: trangThaiMoi }));
                }
            }
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
            hienThiThongBao("Không thể cập nhật trạng thái đơn hàng.");
        }
    };

    return (
        <div className="donhang-page">

            {thongBaoToast && (
                <div className="toast-notification">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoToast}</span>
                </div>
            )}

            <div className="donhang-header">
                <span className="donhang-title">Quản lý đơn hàng</span>
                <label className="donhang-desc">Theo dõi trạng thái, vận chuyển và thông tin thanh toán đơn hàng</label>
            </div>

            {/* BỘ LỌC TRẠNG THÁI (TABS) */}
            <div className="donhang-filter-tabs">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        className={`tab-btn tab-${tab.key} ${trangThaiDangChon.toLowerCase() === tab.label.toLowerCase() ? "active" : ""}`}
                        onClick={() => {
                            setTrangThaiDangChon(tab.label);
                            setTrangThaiDonHang(1);
                        }}
                    >
                        {tab.label} ({demSoLuong(tab.label)})
                    </button>
                ))}
            </div>

            {/* TÌM KIẾM + CHỌN KHOẢNG NGÀY */}
            <div className="donhang-toolbar">
                <div className="search-box">
                    <i className="bx bx-search-big" />
                    <input
                        type="search"
                        placeholder="Tìm theo mã đơn hàng, tên khách hàng..."
                        value={tuKhoaTimKiem}
                        onChange={(e) => {
                            setTuKhoaTimKiem(e.target.value);
                            setTrangThaiDonHang(1);
                        }}
                    />
                </div>

                {/* Khung chọn khoảng ngày lập */}
                <div className="date-box">
                    <i className="bx bx-calendar-week" />
                    <span className="date-label">Từ:</span>
                    <input
                        type="date"
                        className="date-input"
                        value={tuNgay}
                        onChange={(e) => {
                            setTuNgay(e.target.value);
                            setTrangThaiDonHang(1);
                        }}
                    />
                    <span className="date-label">Đến:</span>
                    <input
                        type="date"
                        className="date-input"
                        value={denNgay}
                        onChange={(e) => {
                            setDenNgay(e.target.value);
                            setTrangThaiDonHang(1);
                        }}
                    />
                    {(tuNgay || denNgay) && (
                        <button
                            className="btn-clear-date"
                            onClick={() => { setTuNgay(""); setDenNgay(""); }}
                            title="Xóa bộ lọc ngày"
                        >
                            Xóa
                        </button>
                    )}
                </div>
            </div>

            {/* BẢNG ĐƠN HÀNG */}
            <table className="donhang-table">
                {/* Phần cấu trúc Table giữ nguyên như cũ của bạn */}
                <thead>
                    <tr>
                        <th>Mã đơn hàng</th>
                        <th>Khách hàng / SĐT</th>
                        <th>Số sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Ngày lập</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {sanPhamDangHienDonHang.length > 0 ? (
                        sanPhamDangHienDonHang.map((dh, i) => {
                            const ttInfo = formatTrangThai(dh.trangThai);
                            return (
                                <tr key={i}>
                                    <td className="ma-don">#{dh.maHoaDon}</td>
                                    <td>
                                        <div className="khach-hang-info">
                                            <span className="ten-khach">{dh.tenKhachHang}</span>
                                            <span className="sdt-khach">{dh.sdtKhachHang}</span>
                                        </div>
                                    </td>
                                    <td>{dh.tongSoLuongSP} sản phẩm</td>
                                    <td className="tong-tien">đ{Number(dh.tongTien).toLocaleString('vi-VN')}</td>
                                    <td>
                                        <select
                                            value={dh.trangThai}
                                            onChange={(e) => handleCapNhatTrangThai(dh.maHoaDon, e.target.value)}
                                            className={`order-status ${ttInfo.css}`}
                                            disabled={dh.trangThai === 'da_huy' || dh.trangThai === 'hoan_tat'}
                                        >
                                            <option value="cho_xac_nhan">Chờ xác nhận</option>
                                            <option value="xac_nhan">Đã xác nhận</option>
                                            <option value="dang_giao">Đang giao</option>
                                            <option value="hoan_tat">Hoàn tất</option>
                                            <option value="da_huy">Đã hủy</option>
                                        </select>
                                    </td>
                                   <td>{dh.thoiGianLap}</td>
                                    <td>
                                        <button className="btn-chi-tiet" onClick={() => setDonHangDangXem(dh)}>
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                Không tìm thấy đơn hàng phù hợp.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* FOOTER PHÂN TRANG */}
            <div className="donhang-page-pagination">
                <span>
                    Hiển thị {donHangHienThi.length === 0 ? 0 : viTriBatDauTrang + 1} - {Math.min(viTriBatDauTrang + soLuongDonHangMotTrang, donHangHienThi.length)} trên tổng số {donHangHienThi.length} đơn hàng.
                </span>

                <div className="donhang-pagesp-pagination">
                    <button
                        className="donhang-page-page_btn"
                        onClick={() => setTrangThaiDonHang(trangThaiDonHang - 1)}
                        disabled={trangThaiDonHang === 1}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>

                    {danhSachTrangDonHang.map((soTrang) => (
                        <button
                            key={soTrang}
                            className={`donhang-page-page_btn ${trangThaiDonHang === soTrang ? "active" : ""}`}
                            onClick={() => setTrangThaiDonHang(soTrang)}
                        >
                            {soTrang}
                        </button>
                    ))}

                    <button
                        className="donhang-page-page_btn"
                        onClick={() => setTrangThaiDonHang(trangThaiDonHang + 1)}
                        disabled={trangThaiDonHang === tinhSoDonHangMotTrang || tinhSoDonHangMotTrang === 0}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            </div>


            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {donHangDangXem && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Chi tiết đơn hàng: #{donHangDangXem.maHoaDon}</h2>
                            <button className="btn-close" onClick={() => setDonHangDangXem(null)}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Khách hàng:</strong> {donHangDangXem.tenKhachHang}</p>
                            <p><strong>Số điện thoại:</strong> {donHangDangXem.sdtKhachHang}</p>
                            <p><strong>Tên sản phẩm:</strong> {donHangDangXem.tenSanPham || "Đang cập nhật"}</p>
                            <p className="modal-body-img">
                                <strong>Hình ảnh:</strong>
                                <img
                                    src={donHangDangXem.duongDan || "https://via.placeholder.com/150"}
                                    alt="Sản phẩm"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', display: 'block', marginTop: '5px' }}
                                />
                            </p>
                            <p  className="modal-body-money">
                                <strong>Tổng tiền:</strong> 
                                    đ{Number(donHangDangXem.tongTien).toLocaleString('vi-VN')}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                <strong>Trạng thái:</strong>
                               <span>{donHangDangXem.trangThai}</span>
                            </div>

                            <p style={{ marginTop: '10px' }}><strong>Ngày lập:</strong> {new Date(donHangDangXem.thoiGianLap).toLocaleDateString('vi-VN')}</p>
                        </div>

                        <div className="modal-footer">

                            <button className="btn-cancel" onClick={() => setDonHangDangXem(null)}>Đóng</button>

                        </div>

                    </div>

                </div>

            )}
        </div>
    );
}

export default QuanLyDonHang;