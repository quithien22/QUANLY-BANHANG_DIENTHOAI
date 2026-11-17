import React, { useState, useEffect } from "react";
import { hoaDonApi } from "../../API/HoaDonApi";
import "./quanlyhd_admin.css";
import html2pdf from "html2pdf.js";

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
        hoaDonApi.layToanBo()
            .then((danhSach) => {
                setDanhSachHoaDon(danhSach);
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
        const ngayLapDon = new Date(dh.thoiGianLapGoc || dh.thoiGianLap).setHours(0, 0, 0, 0);
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

    // Chi tiết đầy đủ của đơn đang xem (người nhận, địa chỉ, thanh toán, mọi sản phẩm)
    const [chiTiet, setChiTiet] = useState(null);

    const layUrlAnh = (duongDan) => {
        if (!duongDan) return "";
        return duongDan.startsWith("http") ? duongDan : `${process.env.REACT_APP_API_URL || "http://localhost:8080"}${duongDan}`;
    };

    const moChiTiet = (dh) => {
        setDonHangDangXem(dh);
        setChiTiet(null);
        hoaDonApi.layChiTiet(dh.maHoaDon)
            .then(setChiTiet)
            .catch((error) => console.error("Lỗi tải chi tiết đơn hàng:", error));
    };

    const tenPhuongThuc = { cod: "Thanh toán khi nhận hàng (COD)", momo: "Ví MoMo", chuyen_khoan: "Chuyển khoản ngân hàng" };

    // ================= IN HÓA ĐƠN RA PDF =================
    // Lưu mã hóa đơn đang tạo PDF để khóa nút, tránh bấm nhiều lần
    const [dangInPDF, setDangInPDF] = useState(null);

    const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
    const dinhDangTien = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;

    const inHoaDonPDF = async (maHoaDon) => {
        setDangInPDF(maHoaDon);
        try {
            // Lấy chi tiết mới nhất của đơn (người nhận, địa chỉ, thanh toán, toàn bộ sản phẩm)
            const { thongTin, sanPham } = await hoaDonApi.layChiTiet(maHoaDon);

            const tamTinh = sanPham.reduce((tong, sp) => tong + Number(sp.giaBan || 0) * Number(sp.soLuong || 0), 0);
            const chenhLech = Number(thongTin.tongTien || 0) - tamTinh; // < 0: giảm giá, > 0: phí khác

            const dongSanPham = sanPham.map((sp, i) => `
                <tr>
                    <td style="padding:8px;border:1px solid #D1D5DB;text-align:center;">${i + 1}</td>
                    <td style="padding:8px;border:1px solid #D1D5DB;">${escapeHtml(sp.tenSP)}${sp.phanLoai ? ` (${escapeHtml(sp.phanLoai)})` : ""}</td>
                    <td style="padding:8px;border:1px solid #D1D5DB;text-align:center;">${escapeHtml(sp.soLuong)}</td>
                    <td style="padding:8px;border:1px solid #D1D5DB;text-align:right;">${dinhDangTien(sp.giaBan)}</td>
                    <td style="padding:8px;border:1px solid #D1D5DB;text-align:right;">${dinhDangTien(Number(sp.giaBan || 0) * Number(sp.soLuong || 0))}</td>
                </tr>`).join("");

            const dongChenhLech = chenhLech !== 0 ? `
                <tr>
                    <td colspan="4" style="padding:8px;border:1px solid #D1D5DB;text-align:right;">${chenhLech < 0 ? "Giảm giá" : "Phí vận chuyển / phí khác"}</td>
                    <td style="padding:8px;border:1px solid #D1D5DB;text-align:right;">${chenhLech < 0 ? "-" : ""}${dinhDangTien(Math.abs(chenhLech))}</td>
                </tr>` : "";

            const ngayLap = thongTin.thoiGianLap ? new Date(thongTin.thoiGianLap).toLocaleString("vi-VN") : "";
            const tenNguoiNhan = thongTin.hoTenNguoiNhan || thongTin.tenKhachHang || "";
            const sdt = thongTin.sdtNguoiNhan || thongTin.soDienThoai || "";

            const manHinh = document.createElement("div");
            manHinh.style.cssText = "width:720px;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111827;background:#fff;";
            manHinh.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1D4ED8;padding-bottom:12px;margin-bottom:16px;">
                    <div>
                        <div style="font-size:22px;font-weight:700;color:#1D4ED8;">6AE-STORE</div>
                        <div style="color:#6B7280;margin-top:2px;">Chính hãng giá tốt</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:20px;font-weight:700;">HÓA ĐƠN BÁN HÀNG</div>
                        <div style="margin-top:4px;">Mã: <b>#${escapeHtml(thongTin.maHoaDon)}</b></div>
                        <div>Ngày lập: ${escapeHtml(ngayLap)}</div>
                    </div>
                </div>

                <div style="line-height:1.7;margin-bottom:16px;">
                    <div><b>Khách hàng:</b> ${escapeHtml(thongTin.tenKhachHang || tenNguoiNhan)}</div>
                    <div><b>Người nhận:</b> ${escapeHtml(tenNguoiNhan)}${sdt ? ` - ${escapeHtml(sdt)}` : ""}</div>
                    <div><b>Địa chỉ giao hàng:</b> ${escapeHtml(thongTin.diaChiChiTiet || "Chưa có")}</div>
                    <div><b>Thanh toán:</b> ${escapeHtml(tenPhuongThuc[thongTin.phuongThuc] || thongTin.phuongThuc || "Chưa có")}</div>
                </div>

                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#F3F4F6;">
                            <th style="padding:8px;border:1px solid #D1D5DB;width:40px;">STT</th>
                            <th style="padding:8px;border:1px solid #D1D5DB;text-align:left;">Sản phẩm</th>
                            <th style="padding:8px;border:1px solid #D1D5DB;width:50px;">SL</th>
                            <th style="padding:8px;border:1px solid #D1D5DB;width:110px;text-align:right;">Đơn giá</th>
                            <th style="padding:8px;border:1px solid #D1D5DB;width:120px;text-align:right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dongSanPham}
                        <tr>
                            <td colspan="4" style="padding:8px;border:1px solid #D1D5DB;text-align:right;">Tạm tính</td>
                            <td style="padding:8px;border:1px solid #D1D5DB;text-align:right;">${dinhDangTien(tamTinh)}</td>
                        </tr>
                        ${dongChenhLech}
                        <tr style="font-weight:700;background:#EFF6FF;">
                            <td colspan="4" style="padding:10px;border:1px solid #D1D5DB;text-align:right;">TỔNG THANH TOÁN</td>
                            <td style="padding:10px;border:1px solid #D1D5DB;text-align:right;color:#DC2626;">${dinhDangTien(thongTin.tongTien)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display:flex;justify-content:space-between;margin-top:36px;text-align:center;">
                    <div style="width:45%;"><b>Khách hàng</b><div style="color:#6B7280;font-size:12px;">(Ký, ghi rõ họ tên)</div></div>
                    <div style="width:45%;"><b>Người lập hóa đơn</b><div style="color:#6B7280;font-size:12px;">(Ký, ghi rõ họ tên)</div></div>
                </div>
                <div style="margin-top:60px;text-align:center;color:#6B7280;font-size:12px;">Cảm ơn quý khách đã mua sắm tại 6AE-STORE!</div>
            `;

            await html2pdf().from(manHinh).set({
                margin: 10,
                filename: `HoaDon_${thongTin.maHoaDon}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            }).save();
        } catch (error) {
            console.error("Lỗi in hóa đơn PDF:", error);
            hienThiThongBao("Không thể tạo file PDF hóa đơn.");
        } finally {
            setDangInPDF(null);
        }
    };

    const handleCapNhatTrangThai = async (maHoaDon, trangThaiMoi) => {
        try {
            const ketQua = await hoaDonApi.capNhatTrangThai(maHoaDon, trangThaiMoi);
            if (ketQua.success) {
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
                                        <button
                                            className="btn-chi-tiet"
                                            style={{ marginRight: 6 }}
                                            onClick={() => inHoaDonPDF(dh.maHoaDon)}
                                            disabled={dangInPDF === dh.maHoaDon}
                                        >
                                            {dangInPDF === dh.maHoaDon ? "Đang tạo..." : "In PDF"}
                                        </button>
                                        <button className="btn-chi-tiet" onClick={() => moChiTiet(dh)}>
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
                            <p><strong>Số điện thoại:</strong> {donHangDangXem.sdtKhachHang || chiTiet?.thongTin?.sdtNguoiNhan || "Chưa có"}</p>
                            {chiTiet?.thongTin?.hoTenNguoiNhan && (
                                <p><strong>Người nhận:</strong> {chiTiet.thongTin.hoTenNguoiNhan}{chiTiet.thongTin.sdtNguoiNhan ? ` - ${chiTiet.thongTin.sdtNguoiNhan}` : ""}</p>
                            )}
                            <p><strong>Địa chỉ giao hàng:</strong> {chiTiet ? (chiTiet.thongTin.diaChiChiTiet || "Chưa có") : "Đang tải..."}</p>
                            <p><strong>Thanh toán:</strong> {chiTiet ? (tenPhuongThuc[chiTiet.thongTin.phuongThuc] || chiTiet.thongTin.phuongThuc || "Chưa có") : "Đang tải..."}</p>
                            <div style={{ marginBottom: '10px' }}>
                                <strong>Sản phẩm:</strong>
                                {chiTiet ? (
                                    <ul style={{ margin: '5px 0 0 18px' }}>
                                        {chiTiet.sanPham.map((sp, i) => (
                                            <li key={i}>
                                                {sp.tenSP}{sp.phanLoai ? ` (${sp.phanLoai})` : ""} x {sp.soLuong} - đ{Number(sp.giaBan).toLocaleString('vi-VN')}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span> {donHangDangXem.tenSanPham || "Đang tải..."}</span>
                                )}
                            </div>
                            <p className="modal-body-img">
                                <strong>Hình ảnh:</strong>
                                <img
                                    src={layUrlAnh(donHangDangXem.img) || "https://via.placeholder.com/150"}
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
                               <span>{formatTrangThai(donHangDangXem.trangThai).text}</span>
                            </div>

                            <p style={{ marginTop: '10px' }}><strong>Ngày lập:</strong> {donHangDangXem.thoiGianLapGoc ? new Date(donHangDangXem.thoiGianLapGoc).toLocaleString('vi-VN') : donHangDangXem.thoiGianLap}</p>
                        </div>

                        <div className="modal-footer">

                            <button
                                className="btn-chi-tiet"
                                style={{ marginRight: 8 }}
                                onClick={() => inHoaDonPDF(donHangDangXem.maHoaDon)}
                                disabled={dangInPDF === donHangDangXem.maHoaDon}
                            >
                                {dangInPDF === donHangDangXem.maHoaDon ? "Đang tạo..." : "In hóa đơn PDF"}
                            </button>
                            <button className="btn-cancel" onClick={() => setDonHangDangXem(null)}>Đóng</button>

                        </div>

                    </div>

                </div>

            )}
        </div>
    );
}

export default QuanLyDonHang;