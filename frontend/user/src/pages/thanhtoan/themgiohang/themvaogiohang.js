import React, { useState, useEffect } from "react";
import "./themvaogiohang.css";
import { Link, useNavigate } from "react-router-dom";
import { cartApi } from "../../../API/CartApi";
import { promotionApi } from "../../../API/PromotionApi";
import { layUrlAnh } from "../../../utils/imageUrl";

function ThemVaoGioHang() {

    const navigate = useNavigate();

    // GHI CHÚ: Header đang lưu người dùng ở key "userData" (không phải
    // "userInfo"), nên đổi lại đúng key này để 2 nơi đồng bộ với nhau
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    const [danhSachGioHang, setDanhSachGioHang] = useState([]);
    const [dangTai, setDangTai] = useState(true);

    const taiGioHang = () => {
        if (!maKH) {
            setDangTai(false);
            return;
        }
        setDangTai(true);
        cartApi.getCart(maKH)
            .then((data) => setDanhSachGioHang(data))
            .catch((error) => console.error("Lỗi khi tải giỏ hàng:", error))
            .finally(() => setDangTai(false));
    };

    useEffect(() => {
        taiGioHang();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maKH]);

    // ============== TĂNG / GIẢM SỐ LƯỢNG ===========
    const capNhatSoLuong = (item, soLuongMoi) => {
        cartApi.updateQuantity(item.maGioHang, soLuongMoi)
            .then(() => taiGioHang())
            .catch((error) => console.error("Lỗi khi cập nhật số lượng:", error));
    };

    const tangSoLuong = (item) => capNhatSoLuong(item, item.soLuong + 1);
    const giamSoLuong = (item) => capNhatSoLuong(item, item.soLuong - 1); // backend tự xóa nếu <= 0

    // ============== XÓA KHỎI GIỎ ===========
    const xoaKhoiGio = (item) => {
        const xacNhan = window.confirm(`Xóa "${item.tenSP}" khỏi giỏ hàng?`);
        if (!xacNhan) return;
        cartApi.removeItem(item.maGioHang)
            .then(() => taiGioHang())
            .catch((error) => console.error("Lỗi khi xóa sản phẩm khỏi giỏ:", error));
    };

    // ============== MÃ GIẢM GIÁ ===========
    const [maNhap, setMaNhap] = useState("");
    const [khuyenMaiApDung, setKhuyenMaiApDung] = useState(null);
    const [loiMaGiamGia, setLoiMaGiamGia] = useState("");

    const apDungMaGiamGia = () => {
        if (!maNhap.trim()) return;
        setLoiMaGiamGia("");
        promotionApi.applyCoupon(maNhap.trim())
            .then((data) => {
                setDanhSachGioHang(data);
                // Báo Header cập nhật lại số lượng (sau khi tăng/giảm/xóa)
                window.dispatchEvent(new Event("gioHangCapNhat"));
            })
            .catch((error) => {
                setKhuyenMaiApDung(null);
                setLoiMaGiamGia(error.response?.data?.message || "Không thể áp dụng mã giảm giá");
            });
    };

    // ============== TÍNH TOÁN TỔNG TIỀN ===========
    const dinhDangTien = (soTien) => `${(Number(soTien) || 0).toLocaleString("vi-VN")}đ`;

    const donGia = (item) => (Number(item.giaBan) || 0) + (Number(item.giaChenhLech) || 0);

    const tamTinh = danhSachGioHang.reduce((tong, item) => tong + donGia(item) * item.soLuong, 0);
    const phiGiaoDich = 0; // Miễn phí - chưa nối với cấu hình phí vận chuyển thật
    const soTienGiam = khuyenMaiApDung ? (tamTinh * khuyenMaiApDung.phanTram) / 100 : 0;
    const tongThanhToan = tamTinh - soTienGiam + phiGiaoDich;

    // ============== GIAO DIỆN ===========
    if (!maKH) {
        return (
            <div className="add-cart">
                <p className="add-cart-trang-thai">
                    Bạn cần <Link to="/dang-nhap">đăng nhập</Link> để xem giỏ hàng.
                </p>
            </div>
        );
    }

    if (dangTai) {
        return (
            <div className="add-cart">
                <p className="add-cart-trang-thai">Đang tải giỏ hàng...</p>
            </div>
        );
    }

    if (danhSachGioHang.length === 0) {
        return (
            <div className="add-cart">
                <p className="add-cart-trang-thai">
                    Giỏ hàng của bạn đang trống. <Link to="/home">Tiếp tục mua sắm</Link>
                </p>
            </div>
        );
    }

    // SU LY CHUYEN TRANG
    const xuLyDatHang = () => {
        navigate("/home/themgiohang/tienhanhdathang", {
            state: {
                danhSachSanPhamChonMua: danhSachGioHang,
                khuyenMai: khuyenMaiApDung,
            }
        });
    };

    return (
        <div className="add-cart">
            {/* THANH TIẾN TRÌNH */}
            <div className="add-cart-steps">
                <ul>
                    <li className="add-cart-step active">
                        <span className="add-cart-step_number add-cart-step_number-1">1</span>
                        <span className="add-cart-step_label-1">Giỏ hàng</span>
                    </li>
                    <li className="add-cart-step">
                        <span className="add-cart-step_number add-cart-step_number-2">2</span>
                        <span className="add-cart-step_label">Thông tin đơn hàng</span>
                    </li>
                    <li className="add-cart-step">
                        <span className="add-cart-step_number add-cart-step_number-2">3</span>
                        <span className="add-cart-step_label">Thanh toán thành công</span>
                    </li>
                </ul>
            </div>

            <div className="add-cart-content">
                <ul className="add-cart-list">
                    {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM TRONG GIỎ (nhiều dòng) */}
                    <div className="add-cart-items-wrap">
                        {danhSachGioHang.map((item) => (
                            <li className="add-cart-item" key={item.maGioHang}>
                                <div className="add-cart-item_imgwrap">
                                    <img
                                        src={layUrlAnh(item.hinhAnh)}
                                        alt={item.tenSP}
                                    />
                                </div>
                                <div className="add-cart-item_info">
                                    <span className="add-cart-item_name">{item.tenSP}</span>
                                    {item.bienTheGiaTri && (
                                        <span className="add-cart-item_color">Phân loại: {item.bienTheGiaTri}</span>
                                    )}

                                    <div className="add-cart-item_actions">
                                        <div className="add-cart-item_qty">
                                            <button className="add-cart-qty_btn" onClick={() => giamSoLuong(item)}>-</button>
                                            <span>{item.soLuong}</span>
                                            <button className="add-cart-qty_btn" onClick={() => tangSoLuong(item)}>+</button>
                                        </div>
                                        <button className="add-cart-item_remove" onClick={() => xoaKhoiGio(item)}>
                                            Xóa khỏi giỏ
                                            <i className="bx bx-trash" />
                                        </button>
                                    </div>
                                </div>
                                <div className="add-cart-item-price">
                                    <span className="add-cart-item-price-newprice">{dinhDangTien(donGia(item))}</span>
                                </div>
                            </li>
                        ))}
                    </div>

                    {/* TỔNG ĐƠN HÀNG */}
                    <li className="add-cart-summary">
                        <span className="add-cart-summary_title">TỔNG ĐƠN HÀNG</span>
                        <div className="add-cart-summary_rows">
                            <div className="add-cart-summary_row">
                                <span className="add-cart-summary_row-title">Tạm tính ({danhSachGioHang.length} sản phẩm):</span>
                                <span className="add-cart-summary_row-ttinh">{dinhDangTien(tamTinh)}</span>
                            </div>
                            <div className="add-cart-summary_row">
                                <span className="add-cart-summary_row-title">Phí giao dịch:</span>
                                <span className="add-cart-summary_row-pgdich">
                                    {phiGiaoDich === 0 ? "Miễn phí" : dinhDangTien(phiGiaoDich)}
                                </span>
                            </div>
                            {khuyenMaiApDung && (
                                <div className="add-cart-summary_row add-cart-summary_row-boder">
                                    <span className="add-cart-summary_row-title">Mã giảm giá ({khuyenMaiApDung.tenKM}):</span>
                                    <span className="add-cart-summary_row-mggia">-{dinhDangTien(soTienGiam)}</span>
                                </div>
                            )}
                        </div>

                        <div className="add-cart-summary_footer">
                            <div className="add-cart-summary_total">
                                <span className="add-cart-summary_total-title">Tổng thanh toán:</span>
                                <span className="add-cart-summary_total-title-price">{dinhDangTien(tongThanhToan)}</span>
                            </div>
                            <div className="add-cart-summary_voucher">
                                <input
                                    type="text"
                                    placeholder="Nhập mã giảm giá"
                                    value={maNhap}
                                    onChange={(e) => setMaNhap(e.target.value)}
                                />
                                <button onClick={apDungMaGiamGia}>Áp dụng</button>
                            </div>
                            {loiMaGiamGia && <span className="add-cart-summary_voucher-loi">{loiMaGiamGia}</span>}

                            <button className="add-cart-summary_checkout" onClick={xuLyDatHang}>Tiến hành đặt hàng</button>

                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}
export default ThemVaoGioHang;