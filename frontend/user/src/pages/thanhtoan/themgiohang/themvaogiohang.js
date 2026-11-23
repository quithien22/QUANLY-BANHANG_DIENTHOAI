import React, { useState, useEffect } from "react";
import "./themvaogiohang.css";
import { Link, useNavigate } from "react-router-dom";
import { cartApi } from "../../../API/CartApi";
import { promotionApi } from "../../../API/PromotionApi";
import { layUrlAnh } from "../../../utils/imageUrl";
import Swal from "sweetalert2";

function ThemVaoGioHang() {

    const navigate = useNavigate();

    // GHI CHÚ: Header đang lưu người dùng ở key "userData" (không phải
    // "userInfo"), nên đổi lại đúng key này để 2 nơi đồng bộ với nhau
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    const [danhSachGioHang, setDanhSachGioHang] = useState([]);
    const [dangTai, setDangTai] = useState(true);
    // Thông báo nhỏ góc phải màn hình, tự tắt sau 4 giây
    const hienToast = (icon, tieuDe) => Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title: tieuDe,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
    });

    // Đồng hồ 1 giây/lần để hiển thị đếm ngược thời gian giữ hàng (15 phút)
    const [bayGio, setBayGio] = useState(Date.now());

    // yenLang = true: tải lại ngầm (không nháy "Đang tải..."), dùng khi tự động làm mới giỏ
    const taiGioHang = (yenLang = false) => {
        if (!maKH) {
            setDangTai(false);
            return Promise.resolve();
        }
        if (!yenLang) setDangTai(true);
        return cartApi.getCart(maKH)
            .then((data) => {
                // Server trả về "conLaiGiay"; đổi sang mốc giờ của máy khách để đếm ngược không bị lệch đồng hồ
                const moc = Date.now();
                setDanhSachGioHang(data.map((item) => ({
                    ...item,
                    hetHanTai: moc + (Number(item.conLaiGiay) || 0) * 1000,
                })));
                return data;
            })
            .catch((error) => console.error("Lỗi khi tải giỏ hàng:", error))
            .finally(() => setDangTai(false));
    };

    useEffect(() => {
        taiGioHang();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maKH]);

    useEffect(() => {
        const dongHo = setInterval(() => setBayGio(Date.now()), 1000);
        return () => clearInterval(dongHo);
    }, []);

    // Có dòng đã hết 15 phút giữ hàng -> tải lại giỏ (server đã tự xóa dòng đó và hoàn tồn kho)
    useEffect(() => {
        const coDongHetHan = danhSachGioHang.some((item) => item.hetHanTai && item.hetHanTai <= bayGio);
        if (!coDongHetHan) return;

        const soDongTruoc = danhSachGioHang.length;
        taiGioHang(true).then((data) => {
            if (data && data.length < soDongTruoc) {
                hienToast("info", "Một số sản phẩm đã quá 15 phút giữ hàng nên được xóa khỏi giỏ.");
                window.dispatchEvent(new Event("gioHangCapNhat")); // Header cập nhật lại số lượng
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bayGio]);

    // ============== TĂNG / GIẢM SỐ LƯỢNG ===========
    const capNhatSoLuong = (item, soLuongMoi) => {
        cartApi.updateQuantity(item.maGioHang, soLuongMoi)
            .then(() => taiGioHang())
            .catch((error) => {
                console.error("Lỗi khi cập nhật số lượng:", error);
                // 409: hết hàng / không đủ tồn kho; 404, 410: dòng đã quá 15 phút giữ hàng
                hienToast("error", error.response?.data?.message || "Không thể cập nhật số lượng, vui lòng thử lại.");
                taiGioHang(true);
            });
    };

    const tangSoLuong = (item) => capNhatSoLuong(item, item.soLuong + 1);
    const giamSoLuong = (item) => capNhatSoLuong(item, item.soLuong - 1); // backend tự xóa nếu <= 0

    // ============== XÓA KHỎI GIỎ ===========
    const xoaKhoiGio = async (item) => {
        const ketQua = await Swal.fire({
            icon: "warning",
            title: "Xóa khỏi giỏ hàng?",
            text: `"${item.tenSP}" sẽ bị xóa khỏi giỏ hàng của bạn.`,
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Giữ lại",
            confirmButtonColor: "#dc2626",
        });
        if (!ketQua.isConfirmed) return;
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
                // Server trả { success, khuyenMai: { maKM, tenKM, phanTram } }.
                // Trước đây gán nhầm cả object này vào danh sách giỏ hàng (setDanhSachGioHang(data)) nên trang
                // sập ngay khi bấm Áp dụng ("danhSachGioHang.map is not a function") và mã không bao giờ được lưu.
                setKhuyenMaiApDung(data.khuyenMai);
            })
            .catch((error) => {
                setKhuyenMaiApDung(null);
                setLoiMaGiamGia(error.response?.data?.message || "Không thể áp dụng mã giảm giá");
            });
    };

    // ============== TÍNH TOÁN TỔNG TIỀN ===========
    const dinhDangTien = (soTien) => `${(Number(soTien) || 0).toLocaleString("vi-VN")}đ`;

    // mm:ss còn lại của thời gian giữ hàng
    const dinhDangDemNguoc = (ms) => {
        const tongGiay = Math.max(0, Math.ceil(ms / 1000));
        const phut = String(Math.floor(tongGiay / 60)).padStart(2, "0");
        const giay = String(tongGiay % 60).padStart(2, "0");
        return `${phut}:${giay}`;
    };

    const donGia = (item) => (Number(item.giaBan) || 0) + (Number(item.giaChenhLech) || 0);

    const tamTinh = danhSachGioHang.reduce((tong, item) => tong + donGia(item) * item.soLuong, 0);
    const phiGiaoDich = 0; // Miễn phí - chưa nối với cấu hình phí vận chuyển thật
    const soTienGiam = khuyenMaiApDung ? Math.round((tamTinh * khuyenMaiApDung.phanTram) / 100) : 0;
    const tongThanhToan = tamTinh - soTienGiam + phiGiaoDich;

    // ============== GIAO DIỆN ===========
    if (!maKH) {
        return (
            <div className="add-cart">
                <p className="add-cart-trang-thai">
                    Bạn cần <Link to="/login">đăng nhập</Link> để xem giỏ hàng.
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
                danhSachSanPhamChonMua: danhSachGioHang.map((item) => ({ ...item, gia: donGia(item), tenPhanLoai: item.tenPhanLoai || item.bienTheGiaTri || "" })),
                khuyenMai: khuyenMaiApDung,
            }
        });
    };

    return (
        <div className="add-cart">
            {/* THANH TIẾN TRÌNH */}
            <div className="add-cart-steps">
                <ul>
                    <li className="add-cart-step" aria-current="step">
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
                                    {item.hetHanTai && (
                                        <span className="add-cart-item_color">Giữ hàng còn {dinhDangDemNguoc(item.hetHanTai - bayGio)}</span>
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