import React, { useState, useEffect } from "react";
import { khachHangApi } from "../../API/KhachHangApi";
import "./khachhang_admin.css";

function KhachHang() {
    // 1. State chứa danh sách từ Database
    const [danhSachKhachHang, setDanhSachKhachHang] = useState([]);

    // 2. State cho Tìm kiếm và Lọc
    const [tuKhoa, setTuKhoa] = useState("");
    const [trangThaiLoc, setTrangThaiLoc] = useState(false); // Ẩn/hiện menu dropdown
    const [boLocTrangThai, setBoLocTrangThai] = useState("Tất cả"); // Tất cả, Hoạt động, Đã khóa

    // 3. State cho Modal Chi tiết & Sửa
    const [khachHangDangXem, setKhachHangDangXem] = useState(null);

    const [khachHangDangSua, setKhachHangDangSua] = useState(null);
    const [tenSua, setTenSua] = useState("");
    const [sdtSua, setSdtSua] = useState("");
    const [trangThaiSua, setTrangThaiSua] = useState(true);

    // GỌI API LẤY DANH SÁCH
    const taiDanhSach = () => {
        khachHangApi.layDanhSach()
            .then((danhSach) => {
                setDanhSachKhachHang(danhSach);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiDanhSach();
    }, []);

    // 4. LOGIC LỌC DỮ LIỆU KẾT HỢP (Tìm kiếm + Trạng thái)
    const danhSachSauKhiLoc = danhSachKhachHang.filter(kh => {
        // Lọc theo từ khóa (Tên, SĐT, Email)
        const keyword = tuKhoa.toLowerCase();
        const matchTuKhoa =
            (kh.hoTen && kh.hoTen.toLowerCase().includes(keyword)) ||
            (kh.SDT && kh.SDT.includes(keyword)) ||
            (kh.email && kh.email.toLowerCase().includes(keyword));

        // Lọc theo trạng thái tài khoản
        let matchTrangThai = true;
        if (boLocTrangThai === "Hoạt động") matchTrangThai = kh.trangThai === true;
        if (boLocTrangThai === "Đã khóa") matchTrangThai = kh.trangThai === false;

        return matchTuKhoa && matchTrangThai;
    });

    // 5. LOGIC PHÂN TRANG (Dựa trên danh sách đã lọc)
    const soLuongMotTrang = 10;
    const [trangHienTai, setTrangHienTai] = useState(1);

    const tongSoTrang = Math.ceil(danhSachSauKhiLoc.length / soLuongMotTrang);
    const viTriBatDau = (trangHienTai - 1) * soLuongMotTrang;

    const khachHangHienThi = danhSachSauKhiLoc.slice(viTriBatDau, viTriBatDau + soLuongMotTrang);
    const mangSoTrang = Array.from({ length: tongSoTrang }, (_, i) => i + 1);

    // Đặt lại trang 1 khi gõ tìm kiếm hoặc đổi bộ lọc
    useEffect(() => {
        setTrangHienTai(1);
    }, [tuKhoa, boLocTrangThai]);

    const chuyenTrangThaiKhachHang = (tt) => {
        return tt ? "hoat-dong" : "dang-khoa";
    };

    // Hàm mở form Sửa
    const handleMoFormSua = (kh) => {
        setKhachHangDangSua(kh);
        setTenSua(kh.hoTen);
        setSdtSua(kh.SDT);
        setTrangThaiSua(kh.trangThai);
    };

    // Hàm gọi API Sửa khách hàng
    const handleLuuSua = async (e) => {
        e.preventDefault();
        try {
            const ketQua = await khachHangApi.suaThongTin(khachHangDangSua.maKH, {
                hoTen: tenSua,
                SDT: sdtSua,
                trangThai: trangThaiSua === "true" || trangThaiSua === true
            });
            if (ketQua.success) {
                alert("Cập nhật thành công!");
                setKhachHangDangSua(null);
                taiDanhSach(); // Tải lại list
            }
        } catch (error) {
            console.error("Lỗi khi sửa khách hàng:", error);
            alert("Cập nhật thất bại!");
        }
    };

    return (
        <div className="khachhang-container">
            {/* KHU VỰC HEADER */}
            <div className="khachhang-header">
                <div className="khachhang-title-wrapper">
                    <span className="khachhang-title">Quản lý khách hàng</span>
                    <label className="khachhang-subtitle">Danh sách người dùng đăng ký tài khoản mua hàng</label>
                </div>
                <span className="khachhang-total-count">Tổng: {danhSachSauKhiLoc.length} khách hàng.</span>
            </div>

            {/* KHU VỰC TÌM KIẾM VÀ LỌC */}
            <div className="khachhang-toolbar">
                <div className="khachhang-search-box">
                    <i className="bx bx-search" />
                    <input
                        type="search"
                        placeholder="Tìm tên, SĐT, Email..."
                        value={tuKhoa}
                        onChange={(e) => setTuKhoa(e.target.value)}
                    />
                </div>

                <div className="khachhang-filter-wrapper">
                    <div
                        className="khachhang-filter-btn"
                        onClick={() => setTrangThaiLoc(!trangThaiLoc)}
                    >
                        <span>{boLocTrangThai === "Tất cả" ? "Trạng thái tài khoản" : boLocTrangThai}</span>
                        <i className={trangThaiLoc ? "bx bx-chevron-up" : "bx bx-chevron-down"} />
                    </div>

                    {trangThaiLoc && (
                        <div className="khachhang-filter-menu">
                            <ul>
                                <li onClick={() => { setBoLocTrangThai("Tất cả"); setTrangThaiLoc(false); }}>Tất cả</li>
                                <li onClick={() => { setBoLocTrangThai("Hoạt động"); setTrangThaiLoc(false); }}>Hoạt động</li>
                                <li onClick={() => { setBoLocTrangThai("Đã khóa"); setTrangThaiLoc(false); }}>Đã khóa</li>
                            </ul>
                        </div>
                    )}
                </div>
        
        </div>

            {/* KHU VỰC BẢNG DỮ LIỆU */ }
    <table className="khachhang-table">
        <thead>
            <tr>
                <th>Mã KH</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Điểm tích lũy</th>
                <th>Tổng đơn hàng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
            </tr>
        </thead>
        <tbody>
            {khachHangHienThi.length > 0 ? (
                khachHangHienThi.map((kh, i) => (
                    <tr key={i}>
                        <td className="khachhang-id">{kh.maKH}</td>
                        <td>
                            <div className="khachhang-info-wrapper">
                                <span className="khachhang-name">{kh.hoTen}</span>
                            </div>
                        </td>
                        <td className="khachhang-phone">{kh.SDT}</td>
                        <td className="khachhang-score">
                            <i className="bx bx-star" /> {kh.diemTichLuy || 0}
                        </td>
                        <td className="khachhang-orders-count">{kh.tongDonHang || 0}</td>
                        <td>
                            <span className={`trang-thai trang-thai-${chuyenTrangThaiKhachHang(kh.trangThai)}`}>
                                {kh.trangThai ? "Hoạt động" : "Đã khóa"}
                            </span>
                        </td>
                        <td>
                            <div className="khachhang-actions">
                                <button className="khachhang-btn-edit" onClick={() => handleMoFormSua(kh)}>
                                    <i className="bx bx-edit-alt"></i> Sửa
                                </button>
                                <button
                                    className="khachhang-btn-detail"
                                    onClick={() => setKhachHangDangXem(kh)}
                                >
                                    <i className="bx bx-show"></i> Chi Tiết
                                </button>
                            </div>
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy khách hàng nào.</td>
                </tr>
            )}
        </tbody>
    </table>

    {/* KHU VỰC PHÂN TRANG */ }
    <div className="khachhang-pagination-container">
        <span className="khachhang-pagination-info">
            Hiển thị {danhSachSauKhiLoc.length === 0 ? 0 : viTriBatDau + 1} - {Math.min(viTriBatDau + soLuongMotTrang, danhSachSauKhiLoc.length)} trên tổng số {danhSachSauKhiLoc.length} khách hàng.
        </span>

        <div className="khachhang-pagination-buttons">
            <button
                className="khachhang-page-btn"
                onClick={() => setTrangHienTai(trangHienTai - 1)}
                disabled={trangHienTai === 1}
            >
                <i className="bx bx-chevron-left"></i>
            </button>

            {mangSoTrang.map((soTrang) => (
                <button
                    key={soTrang}
                    className={`khachhang-page-btn ${trangHienTai === soTrang ? "active" : ""}`}
                    onClick={() => setTrangHienTai(soTrang)}
                >
                    {soTrang}
                </button>
            ))}

            <button
                className="khachhang-page-btn"
                onClick={() => setTrangHienTai(trangHienTai + 1)}
                disabled={trangHienTai === tongSoTrang || tongSoTrang === 0}
            >
                <i className="bx bx-chevron-right"></i>
            </button>
        </div>
    </div>

    {/* MODAL SỬA KHÁCH HÀNG */}
            {khachHangDangSua && (
                <div className="khachhang-modal-overlay">
                    <div className="khachhang-modal-content modal-edit-box">
                        <div className="modal-edit-header">
                            <h2>Sửa thông tin: {khachHangDangSua.maKH}</h2>
                            <button className="khachhang-modal-close" onClick={() => setKhachHangDangSua(null)}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleLuuSua} className="modal-edit-form">
                            <div className="modal-edit-group">
                                <label>Tên khách hàng:</label>
                                <input type="text" value={tenSua} onChange={(e) => setTenSua(e.target.value)} required />
                            </div>
                            <div className="modal-edit-group">
                                <label>Số điện thoại:</label>
                                <input type="text" value={sdtSua} onChange={(e) => setSdtSua(e.target.value)} required />
                            </div>
                            <div className="modal-edit-group">
                                <label>Trạng thái tài khoản:</label>
                                <select value={trangThaiSua} onChange={(e) => setTrangThaiSua(e.target.value)}>
                                    <option value={true}>Hoạt động (Mở khóa)</option>
                                    <option value={false}>Đã khóa (Chặn)</option>
                                </select>
                            </div>
                            <button type="submit" className="modal-edit-submit">
                                Lưu thay đổi
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XEM CHI TIẾT */}
            {khachHangDangXem && (
                <div className="khachhang-modal-overlay">
                    <div className="khachhang-modal-content detail-box">
                        <button className="khachhang-modal-close" onClick={() => setKhachHangDangXem(null)}>
                            <i className="bx bx-x"></i>
                        </button>

                        <div className="khachhang-detail-header">
                            <div className="khachhang-detail-profile">
                                <img src="https://placehold.co/64" alt="Avatar" className="detail-avatar" />
                                <div className="detail-info">
                                    <h3>{khachHangDangXem.hoTen}</h3>
                                    <p>SĐT: {khachHangDangXem.SDT}</p>
                                </div>
                            </div>

                            <div className="khachhang-detail-stats">
                                <div className="stat-box">
                                    <span className="stat-label">Số đơn hàng</span>
                                    <span className="stat-value">{khachHangDangXem.tongDonHang || 0} đơn</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Điểm tích lũy</span>
                                    <span className="stat-value text-orange">{khachHangDangXem.diemTichLuy || 0} điểm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

export default KhachHang;