import React, { useState, useEffect } from "react";
import { orderApi } from "../../../../API/OrderApi";
import "./lichsumuahang.css";
import { Link, useNavigate } from "react-router-dom";

function LichSuMuaHang() {
    const navigate = useNavigate();
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH || nguoiDung?.userInfo?.maKH;

    const [danhSachHD, setDanhSachHD] = useState([]);
    const [trangThaiTab, setTrangThaiTab] = useState("Tất cả");
    const [dangTai, setDangTai] = useState(true);

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

        let gioHangHienTai = JSON.parse(localStorage.getItem("gioHang") || localStorage.getItem("cart") || "[]");

        danhSachSanPham.forEach(spCu => {
            const index = gioHangHienTai.findIndex(item => 
                item.maSP === spCu.maSP && (item.maBienThe || null) === (spCu.maBienThe || null)
            );

            if (index > -1) {
                gioHangHienTai[index].soLuong += Number(spCu.soLuong || 1);
            } else {
                gioHangHienTai.push({
                    maSP: spCu.maSP,
                    tenSP: spCu.tenSP || spCu.tenSanPham,
                    hinhAnh: spCu.hinhAnh,
                    gia: Number(spCu.donGia || spCu.giaBan || 0),    
                    giaBan: Number(spCu.donGia || spCu.giaBan || 0), 
                    soLuong: Number(spCu.soLuong || 1),
                    maBienThe: spCu.maBienThe || null,
                    tenPhanLoai: spCu.tenPhanLoai || spCu.mauSac || "Tiêu chuẩn"
                });
            }
        });

        localStorage.setItem("gioHang", JSON.stringify(gioHangHienTai));
        localStorage.setItem("cart", JSON.stringify(gioHangHienTai));  

        alert("Đã thêm các sản phẩm vào giỏ hàng thành công!");
        navigate("/themgiohang");  
    } catch (error) {
        console.error("Lỗi đặt lại đơn hàng:", error);
        alert("Không thể thêm sản phẩm vào giỏ hàng lúc này, vui lòng thử lại!");
    }
};

    if (!maKH) return <div className="lsmh-empty">Vui lòng đăng nhập để xem lịch sử mua hàng.</div>;

    return (
        <div className="lsmh-container">
            <ul className="lsmh-breadcrumb">
                <Link to="/home">
                    <li className="lsmh-breadcrumb_1">
                        <span>Trang chủ</span>
                        <i className="bx bx-chevron-right"></i>
                    </li>
                </Link>
                <Link to="/tai-khoan">
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
                    {["Tất cả", "Chờ xác nhận", "Đang giao", "Đã giao", "Đã hủy"].map((tab) => (
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