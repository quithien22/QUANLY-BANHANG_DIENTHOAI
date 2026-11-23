import React, { useState, useEffect } from "react";
import { orderApi } from "../../../../API/OrderApi";
import { cartApi } from "../../../../API/CartApi";
import "./lichsumuahang.css";
import { layUrlAnh } from "../../../../utils/imageUrl";
import { Link, useNavigate } from "react-router-dom";

function LichSuMuaHang() {
    const navigate = useNavigate();
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH || nguoiDung?.userInfo?.maKH;

    const [danhSachHD, setDanhSachHD] = useState([]);
    const [trangThaiTab, setTrangThaiTab] = useState("Tất cả");
    const [dangTai, setDangTai] = useState(true);

    // Modal chi tiết đơn hàng
    const [donDangXem, setDonDangXem] = useState(null);
    const [dsSanPhamDon, setDsSanPhamDon] = useState([]);
    const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);

    // Gọi API lấy lịch sử đơn hàng
    useEffect(() => {
        if (!maKH) return;
        setDangTai(true);
        orderApi.getHistory(maKH)
            .then((data) => {
                setDanhSachHD(data.data || []);
            })
            .catch((err) => console.error("Lỗi lấy lịch sử đơn hàng:", err))
            .finally(() => setDangTai(false));
    }, [maKH]);

    // Ánh xạ trạng thái từ Database sang Tiếng Việt hiển thị ở Tab để lọc chính xác
    const chuyenDoiTrangThai = (trangThaiDB) => {
        switch (trangThaiDB) {
            case "cho_xac_nhan": return "Chờ xác nhận";
            case "xac_nhan": return "Đã xác nhận"; // admin xác nhận đơn; trước đây hiển thị nguyên mã "xac_nhan" và không nằm trong tab nào
            case "dang_giao": return "Đang giao";
            case "hoan_tat": return "Đã giao";
            case "da_huy": return "Đã hủy";
            default: return trangThaiDB || "Chờ xác nhận";
        }
    };

    // Lọc danh sách theo tab trạng thái người dùng chọn
    const danhSachLoc = danhSachHD.filter(hd => {
        if (trangThaiTab === "Tất cả") return true;
        const trangThaiHienThi = chuyenDoiTrangThai(hd.trangThai);
        return trangThaiHienThi === trangThaiTab;
    });

    const dinhDangTien = (tien) => `${Number(tien || 0).toLocaleString("vi-VN")}đ`;

  // Hàm xử lý nút Đặt lại đơn hàng -> Chuyển hướng đến trang tiến hành đặt hàng
const xuLyDatLai = async (hd) => {
    try {
        const resChiTiet = await orderApi.getItems(hd.maHoaDon);
        const danhSachSanPham = resChiTiet.data || [];

        if (danhSachSanPham.length === 0) {
            alert("Không tìm thấy sản phẩm trong đơn hàng này!");
            return;
        }

        // Thêm từng sản phẩm vào giỏ hàng THẬT (database), lần lượt để việc giữ tồn kho không bị tranh chấp.
        // Sản phẩm hết hàng/không đủ số lượng sẽ bị bỏ qua và được báo lại cho khách.
        const khongThem = [];
        let soDaThem = 0;

        for (const spCu of danhSachSanPham) {
            try {
                await cartApi.addToCart({
                    maKH,
                    maSP: spCu.maSP,
                    maBienThe: spCu.maBienThe || null,
                    tenPhanLoai: spCu.phanLoai || "",
                    giaTaiThoiDiemThem: Number(spCu.donGia) || 0,
                    soLuong: Number(spCu.soLuong) || 1,
                });
                soDaThem += 1;
            } catch (err) {
                khongThem.push(`${spCu.tenSP}: ${err.message}`);
            }
        }

        window.dispatchEvent(new Event("gioHangCapNhat")); // Header cập nhật số lượng giỏ

        if (soDaThem === 0) {
            alert(`Không thể đặt lại đơn hàng:\n${khongThem.join("\n")}`);
            return;
        }
        if (khongThem.length > 0) {
            alert(`Đã thêm ${soDaThem} sản phẩm vào giỏ. Không thêm được:\n${khongThem.join("\n")}`);
        }
        navigate("/home/themgiohang");
    } catch (error) {
        console.error("Lỗi đặt lại đơn hàng:", error);
        alert("Không thể thêm sản phẩm vào giỏ hàng lúc này, vui lòng thử lại!");
    }
};

    const tenPhuongThuc = { cod: "Thanh toán khi nhận hàng (COD)", momo: "Ví MoMo", chuyen_khoan: "Chuyển khoản ngân hàng" };

    const moChiTiet = (hd) => {
        setDonDangXem(hd);
        setDsSanPhamDon([]);
        setDangTaiChiTiet(true);
        orderApi.getItems(hd.maHoaDon)
            .then((res) => setDsSanPhamDon(res.data || []))
            .catch((err) => console.error("Lỗi lấy chi tiết đơn hàng:", err))
            .finally(() => setDangTaiChiTiet(false));
    };

    if (!maKH) return <div className="lsmh-empty">Vui lòng đăng nhập để xem lịch sử mua hàng.</div>;

    return (
        <div className="lsmh-container">
            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {donDangXem && (
                <div className="lsmh-modal-overlay" onClick={() => setDonDangXem(null)}>
                    <div className="lsmh-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="lsmh-modal-header">
                            <h3>Chi tiết đơn hàng #{donDangXem.maHoaDon}</h3>
                            <button className="lsmh-modal-close" onClick={() => setDonDangXem(null)}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="lsmh-modal-body">
                            <div className="lsmh-modal-info">
                                <div><span>Trạng thái:</span> <strong>{chuyenDoiTrangThai(donDangXem.trangThai)}</strong></div>
                                <div><span>Thời gian đặt:</span> {donDangXem.thoiGianLap ? new Date(donDangXem.thoiGianLap).toLocaleString("vi-VN") : ""}</div>
                                <div><span>Người nhận:</span> <strong>{donDangXem.hoTenNguoiNhan}</strong></div>
                                <div><span>Số điện thoại:</span> {donDangXem.SDT}</div>
                                <div><span>Địa chỉ:</span> {donDangXem.diaChiChiTiet}</div>
                                <div><span>Thanh toán:</span> {tenPhuongThuc[donDangXem.phuongThuc] || donDangXem.phuongThuc || "Chưa có"}</div>
                                {donDangXem.ngayGiaoDuKien && (
                                    <div><span>Giao dự kiến:</span> {new Date(donDangXem.ngayGiaoDuKien).toLocaleDateString("vi-VN")}</div>
                                )}
                            </div>

                            <div className="lsmh-modal-title-sp">Sản phẩm trong đơn</div>
                            {dangTaiChiTiet ? (
                                <div className="lsmh-loading">Đang tải sản phẩm...</div>
                            ) : dsSanPhamDon.length === 0 ? (
                                <div className="lsmh-empty">Không có thông tin sản phẩm.</div>
                            ) : (
                                <ul className="lsmh-modal-sp-list">
                                    {dsSanPhamDon.map((sp, i) => (
                                        <li key={i} className="lsmh-modal-sp">
                                            <img src={layUrlAnh(sp.hinhAnh) || ""} alt={sp.tenSP} />
                                            <div className="lsmh-modal-sp-info">
                                                <span className="lsmh-modal-sp-ten">{sp.tenSP}</span>
                                                {sp.phanLoai && <span className="lsmh-modal-sp-phanloai">Phân loại: {sp.phanLoai}</span>}
                                                <span className="lsmh-modal-sp-sl">{dinhDangTien(sp.donGia)} x {sp.soLuong}</span>
                                            </div>
                                            <span className="lsmh-modal-sp-tien">{dinhDangTien(Number(sp.donGia) * Number(sp.soLuong))}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="lsmh-modal-footer">
                            <div className="lsmh-total">
                                Tổng tiền: <span className="lsmh-price">{dinhDangTien(donDangXem.tongTien)}</span>
                            </div>
                            <button className="lsmh-btn-dong" onClick={() => setDonDangXem(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <ul className="lsmh-breadcrumb">
                <Link to="/home">
                    <li className="lsmh-breadcrumb_1">
                        <span>Trang chủ</span>
                        <i className="bx bx-chevron-right"></i>
                    </li>
                </Link>
                <Link to="/home/tai-khoan">
                    <li className="lsmh-breadcrumb_2">
                        <span>Tài khoản khách hàng</span>
                        <i className="bx bx-chevron-right"></i>
                    </li>
                </Link>
                <li className="lsmh-breadcrumb_3">
                    <span>Lịch sử mua hàng</span>
                </li>
            </ul>

            <div className="lsmh-content">
                <h2 className="lsmh-title">Lịch sử mua hàng</h2>

                {/* THANH TAB LỌC TRẠNG THÁI */}
                <div className="lsmh-tabs">
                    {["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"].map((tab) => (
                        <button
                            key={tab}
                            className={`lsmh-tab-btn ${trangThaiTab === tab ? "active" : ""}`}
                            onClick={() => setTrangThaiTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* DANH SÁCH ĐƠN HÀNG */}
                {dangTai ? (
                    <div className="lsmh-loading">Đang tải đơn hàng...</div>
                ) : danhSachLoc.length === 0 ? (
                    <div className="lsmh-empty">Không có đơn hàng nào ở trạng thái này.</div>
                ) : (
                    <div className="lsmh-list">
                        {danhSachLoc.map((hd) => (
                            <div key={hd.maHoaDon || hd.soHoaDon} className="lsmh-card">
                                <div className="lsmh-card-header">
                                    <span className="lsmh-madon">Đơn hàng: #{hd.maHoaDon}</span>
                                    <span className={`lsmh-status badge-${hd.trangThai}`}>
                                        {chuyenDoiTrangThai(hd.trangThai)}
                                    </span>
                                </div>

                                <div className="lsmh-card-body">
                                    <div className="lsmh-info-row">
                                        <span>Người nhận: <strong>{hd.hoTenNguoiNhan}</strong></span>
                                        <span>Thời gian: {hd.thoiGianLap ? new Date(hd.thoiGianLap).toLocaleString("vi-VN") : ""}</span>
                                    </div>
                                    <div>Số điện thoại: {hd.SDT}</div>
                                    <div className="lsmh-address">Địa chỉ: {hd.diaChiChiTiet}</div>
                                </div>

                                <div className="lsmh-card-footer">
                                    <div className="lsmh-total">
                                        Tổng tiền: <span className="lsmh-price">{dinhDangTien(hd.tongTien)}</span>
                                    </div>

                                    <button className="lsmh-btn-chitiet" onClick={() => moChiTiet(hd)}>
                                        Xem chi tiết
                                    </button>

                                    {/* NÚT ĐẶT LẠI ĐƠN HÀNG (ĐÃ TÁCH CSS RIÊNG) */}
                                    <button
                                        onClick={() => xuLyDatLai(hd)}
                                        className="lsmh-btn-datlai"
                                    >
                                        Đặt lại đơn hàng
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LichSuMuaHang;