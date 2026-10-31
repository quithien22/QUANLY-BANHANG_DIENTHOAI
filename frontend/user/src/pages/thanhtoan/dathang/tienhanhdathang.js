import React, { useState, useEffect } from "react";
import "./tienhanhdathang.css";
import { addressApi } from "../../../API/AddressApi";
import { orderApi } from "../../../API/OrderApi";
import { paymentApi } from "../../../API/PaymentApi";
import { useNavigate, useLocation } from "react-router-dom";


function TienHanhDatHang() {
    const navigate = useNavigate();
    const location = useLocation();

    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    // 1. STATE LƯU TRỮ THÔNG TIN KHÁCH HÀNG NHẬP
    const [hoTen, setHoTen] = useState("");
    const [sdt, setSdt] = useState("");
    const [email, setEmail] = useState("");
    const [diaChi, setDiaChi] = useState("");
    const [phuongThuc, setPhuongThuc] = useState("cod");

    // STATE CHO SỔ ĐỊA CHỈ
    const [dsDiaChiGiaoHang, setDsDiaChiGiaoHang] = useState([]);
    const [hienModalDiaChi, setHienModalDiaChi] = useState(false);

    // 2. NHẬN DỮ LIỆU TỪ GIỎ HÀNG THAY VÌ FIX CỨNG
    const [danhSachSanPham, setDanhSachSanPham] = useState([]);

    useEffect(() => {
        if (!location.state) {
            alert("Vui lòng chọn sản phẩm vào giỏ trước khi đặt hàng!");
            navigate("/home");
            return;
        }

        if (location.state.dsMuaNgay) {
            setDanhSachSanPham(location.state.dsMuaNgay);
        } else if (location.state.danhSachSanPhamChonMua) {
            setDanhSachSanPham(location.state.danhSachSanPhamChonMua);
        } else {
            alert("Không tìm thấy sản phẩm cần thanh toán.");
            navigate("/home");
        }
    }, [location, navigate]);

    // GỌI API LẤY ĐỊA CHỈ GIAO HANG CỦA KHÁCH HÀNG  
    useEffect(() => {
        if (maKH) {
            addressApi.list(maKH)
                .then((data) => {
                    const ds = data.data || [];
                    setDsDiaChiGiaoHang(ds);

                    // Nếu có địa chỉ, tự động lấy địa chỉ đầu tiên (Mặc định) điền vào Form
                    if (ds.length > 0) {
                        setHoTen(ds[0].hoTenNguoiNhan || "");
                        setSdt(ds[0].SDT || "");
                        setDiaChi(ds[0].diaChiChiTiet || "");
                    }
                })
                .catch((error) => console.error("Lỗi lấy sổ địa chỉ:", error));
        }
    }, [maKH]);

    // HÀM CHỌN NHANH ĐỊA CHỈ TỪ POPUP
    const chonDiaChiCu = (dc) => {
        setHoTen(dc.hoTenNguoiNhan);
        setSdt(dc.SDT);
        setDiaChi(dc.diaChiChiTiet);
        setHienModalDiaChi(false); // Tắt popup
    };

    //  TÍNH TOÁN TIỀN ĐỘNG
    const tongTienHang = danhSachSanPham.reduce((tong, sp) => tong + ((Number(sp.gia) || Number(sp.giaBan) || 0) * Number(sp.soLuong)), 0);
    const giamGia = 0;
    const phiVanChuyen = 0;
    const tongThanhToan = tongTienHang - giamGia + phiVanChuyen;

    // THONG BAO DAT HANG THANH CONG
    const [thongBaoToast, setThongBaoToast] = useState(null);
    const hienThiThongBaoTC = (noiDung) => {
        setThongBaoToast(noiDung);
        setTimeout(() => {
            setThongBaoToast(null);
            navigate("/home");
        }, 2500);
    };

    // CHUYỂN KHÁCH SANG TRANG THANH TOÁN MOMO
    const thanhToanMoMo = async (maHoaDon, soTien) => {
        try {
            const data = await paymentApi.createMomo({
                amount: soTien,
                orderId: maHoaDon
            });
            if (data?.payUrl) {
                window.location.href = data.payUrl;
            } else {
                alert(`Đơn hàng ${maHoaDon} đã được tạo nhưng chưa mở được cổng MoMo (${data?.message || "lỗi không xác định"}). Vui lòng liên hệ cửa hàng.`);
                navigate("/home");
            }
        } catch (error) {
            console.error("Lỗi tạo thanh toán MoMo:", error);
            alert(`Đơn hàng ${maHoaDon} đã được tạo nhưng không kết nối được MoMo. Vui lòng liên hệ cửa hàng.`);
            navigate("/home");
        }
    };

    // 4. HÀM XỬ LÝ ĐẶT HÀNG GỌI API
    const handleDatHang = async () => {
        if (!hoTen || !sdt || !diaChi) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*) !");
            return;
        }

        const payload = {
            maKH: maKH,
            hoTen: hoTen,
            sdt: sdt,
            diaChi: diaChi,
            phuongThuc: phuongThuc,
            maKM: null,
            danhSachSanPham: danhSachSanPham
        };

        try {
            const data = await orderApi.placeOrder(payload);

            if (data.success) {
                if (phuongThuc === "momo") {
                    await thanhToanMoMo(data.maHoaDon, data.tongTien);
                    return;
                }
                hienThiThongBaoTC("Đặt hàng thành công!");
                // Nếu khách sửa địa chỉ trực tiếp trên form và chưa có trong sổ -> Có thể gọi thêm API Thêm địa chỉ mới ở đây nếu muốn
            }
        } catch (error) {
            console.error("Lỗi khi đặt hàng:", error);
            alert(error.response?.data?.message || "Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại!");
        }
    };

    const dinhDangTien = (tien) => `${tien.toLocaleString("vi-VN")}đ`;

    return (
        <div className="thdathang">
            {/* THANH TIẾN TRÌNH */}
            <div className="thdathang-steps-container">
                <ul className="thdathang-steps-list">
                    <li className="thdathang-step active">
                        <span className="thdathang-step_number thdathang-step_number-1">1</span>
                        <span className="thdathang-step_label-1">Giỏ hàng</span>
                    </li>
                    <li className="thdathang-step">
                        <span className="thdathang-step_number thdathang-step_number-2">2</span>
                        <span className="thdathang-step_label-2">Thông tin đơn hàng</span>
                    </li>
                    <li className="thdathang-step">
                        <span className="thdathang-step_number thdathang-step_number-3">3</span>
                        <span className="thdathang-step_label">Thanh toán thành công</span>
                    </li>
                </ul>
            </div>

            <div className="thdathang-main-content">
                <ul className="thdathang-layout-grid">

                    {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG & THANH TOÁN */}
                    <li className="thdathang-left-column">
                        <div className="thdathang-customer-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <span className="thdathang-section-title" style={{ marginBottom: 0 }}>1. THÔNG TIN NGƯỜI NHẬN</span>
                                {dsDiaChiGiaoHang.length > 0 && (
                                    <button
                                        onClick={() => setHienModalDiaChi(true)}
                                        style={{ padding: '6px 12px', cursor: 'pointer', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '4px', fontWeight: 'bold' }}
                                    >
                                        <i className="bx bx-book-bookmark"></i> Địa chỉ giao hàng
                                    </button>
                                )}
                            </div>

                            <div className="thdathang-customer-info">
                                <div className="thdathang-input-group thdathang-input-group-title">
                                    <span className="thdathang-input-label">Họ và tên người nhận *</span>
                                    <input type="text" placeholder="Nhập họ và tên" className="thdathang-input" value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
                                </div>
                                <div className="thdathang-input-group thdathang-input-group-title">
                                    <span className="thdathang-input-label">Số điện thoại liên hệ *</span>
                                    <input type="text" placeholder="Nhập số điện thoại" className="thdathang-input" value={sdt} onChange={(e) => setSdt(e.target.value)} />
                                </div>
                            </div>

                            <div className="thdathang-input-group">
                                <span className="thdathang-input-label">Email nhận thông tin đơn hàng</span>
                                <input type="text" placeholder="Nhập email" className="thdathang-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>

                            <div className="thdathang-input-group">
                                <span className="thdathang-input-label">Địa chỉ giao hàng chi tiết *</span>
                                <input type="text" placeholder="Nhập địa chỉ (VD: Số nhà, tên đường, phường/xã...)" className="thdathang-input" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
                            </div>
                        </div>

                        <div className="thdathang-payment-section">
                            <span className="thdathang-section-title">2. PHƯƠNG THỨC THANH TOÁN</span>
                            <ul className="thdathang-payment-methods">
                                {/* Phương thức COD */}
                                <li className="thdathang-payment-item">
                                    <button className="thdathang-payment-item-btn" onClick={() => setPhuongThuc("cod")} style={{ border: phuongThuc === "cod" ? "2px solid #1D4ED8" : "1px solid #E5E7EB" }}>
                                        <i className={`bx ${phuongThuc === 'cod' ? 'bxs-check-circle' : 'bx-circle'}`} style={{ color: phuongThuc === 'cod' ? '#1D4ED8' : '#9CA3AF' }} />
                                        <i className="bx bx-wallet-alt" />
                                        <div className="thdathang-payment-content">
                                            <span className="thdathang-payment-name">Thanh toán khi nhận hàng (COD)</span>
                                            <span className="thdathang-payment-desc">Nhận hàng kiểm tra rồi mới giao tiền mặt</span>
                                        </div>
                                    </button>
                                </li>
                                {/* Phương thức Ví điện tử */}
                                <li className="thdathang-payment-item">
                                    <button
                                        className="thdathang-payment-item-btn"
                                        onClick={() => setPhuongThuc("momo")}
                                        style={{ border: phuongThuc === "momo" ? "2px solid #1D4ED8" : "1px solid #E5E7EB" }}
                                    >
                                        <i className={`bx ${phuongThuc === 'momo' ? 'bxs-check-circle' : 'bx-circle'}`} style={{ color: phuongThuc === 'momo' ? '#1D4ED8' : '#9CA3AF' }} />
                                        <i className="bx bx-qr-scan" /> {/* Đổi icon thành quét mã QR */}
                                        <div className="thdathang-payment-content">
                                            <span className="thdathang-payment-name">Ví điện tử MoMo / VNPay</span>
                                            <span className="thdathang-payment-desc">Thanh toán an toàn qua ví điện tử</span>
                                        </div>
                                    </button>
                                </li>
                                {/* Phương thức Chuyển khoản */}
                                <li className="thdathang-payment-item">
                                    <button className="thdathang-payment-item-btn" onClick={() => setPhuongThuc("chuyen_khoan")} style={{ border: phuongThuc === "chuyen_khoan" ? "2px solid #1D4ED8" : "1px solid #E5E7EB" }}>
                                        <i className={`bx ${phuongThuc === 'chuyen_khoan' ? 'bxs-check-circle' : 'bx-circle'}`} style={{ color: phuongThuc === 'chuyen_khoan' ? '#1D4ED8' : '#9CA3AF' }} />
                                        <i className="bx bxs-bank" />
                                        <div className="thdathang-payment-content">
                                            <span className="thdathang-payment-name">Chuyển khoản ngân hàng trực tiếp</span>
                                            <span className="thdathang-payment-desc">Thông tin số tài khoản tự động hiển thị khi hoàn tất</span>
                                        </div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </li>

                    {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG ĐỘNG */}
                    <li className="thdathang-right-column">
                        <ul className="thdathang-summary-list">
                            <span className="thdathang-summary-title">TÓM TẮT ĐƠN HÀNG</span>

                            {danhSachSanPham.map((sp, index) => (
                                <li className="thdathang-summary-item-product" key={index}>
                                    <div className="thdathang-product-details">
                                        <img src={sp.hinhAnh} alt={sp.tenSP} className="thdathang-product-img" />
                                        <div className="thdathang-product-meta">
                                            <span className="thdathang-product-name">{sp.tenSP}</span>
                                            <div className="thdathang-product-variants">
                                                <span className="thdathang-product-qty">Số lượng: {sp.soLuong} </span>
                                                <span className="thdathang-product-color">{sp.tenPhanLoai || "Tiêu chuẩn"}</span>
                                            </div>
                                        </div>
                                        <span className="thdathang-product-price">{dinhDangTien((Number(sp.gia) || Number(sp.giaBan) || 0) * Number(sp.soLuong))}</span>
                                    </div>
                                </li>
                            ))}

                            <li className="thdathang-summary-item-price">
                                <div className="thdathang-summary-rows">
                                    <div className="thdathang-summary-row">
                                        <span className="thdathang-summary-row-title">Tổng tiền hàng:</span>
                                        <span className="thdathang-summary-row-value">{dinhDangTien(tongTienHang)}</span>
                                    </div>
                                    <div className="thdathang-summary-row">
                                        <span className="thdathang-summary-row-title">Giảm giá Voucher:</span>
                                        <span className="thdathang-summary-row-value text-discount">-{dinhDangTien(giamGia)}</span>
                                    </div>
                                    <div className="thdathang-summary-row thdathang-summary-row-border">
                                        <span className="thdathang-summary-row-title">Phí vận chuyển:</span>
                                        <span className="thdathang-summary-row-value text-free">{phiVanChuyen === 0 ? "Miễn phí" : dinhDangTien(phiVanChuyen)}</span>
                                    </div>
                                </div>
                            </li>

                            <li className="thdathang-summary-item-action">
                                <div className="thdathang-summary-total">
                                    <span className="thdathang-summary-total-title">Tổng thanh toán:</span>
                                    <span className="thdathang-summary-total-price">{dinhDangTien(tongThanhToan)}</span>
                                </div>

                                <div className="thdathang-summary-total-xn">
                                    <button className="thdathang-btn-submit" onClick={handleDatHang}>Xác nhận đặt hàng</button>
                                    <span className="thdathang-terms-text">Bằng cách nhấn đặt hàng, bạn đã đồng ý <br />với Điều khoản và Thỏa thuận bán hàng của Thiện Store.</span>
                                </div>
                            </li>
                        </ul>
                    </li>

                </ul>
            </div>

            {/* POPUP MODAL CHỌN SỔ ĐỊA CHỈ */}
            {hienModalDiaChi && (
                <div className="modal-diachi-overlay">
                    <div className="modal-diachi-box">
                        <div className="modal-diachi-header">
                            <h3 className="modal-diachi-title">Chọn địa chỉ nhận hàng</h3>
                            <i className="bx bx-x modal-diachi-close" onClick={() => setHienModalDiaChi(false)}></i>
                        </div>

                        <div className="modal-diachi-list">
                            {dsDiaChiGiaoHang.map(dc => (
                                <div
                                    key={dc.maDiaChi}
                                    onClick={() => chonDiaChiCu(dc)}
                                    className="modal-diachi-item"
                                >
                                    {dc.macDinh === true && <span className="modal-diachi-badge">Mặc định</span>}
                                    <div className="modal-diachi-info-top">{dc.hoTenNguoiNhan} | {dc.SDT}</div>
                                    <div className="modal-diachi-info-detail">{dc.diaChiChiTiet}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* IN RA THÔNG BÁO TOAST NẾU CÓ DỮ LIỆU */}
            {thongBaoToast && (
                <div className="toast-notification">
                    <i className="bx bxs-check-circle"></i> {thongBaoToast}
                </div>
            )}
        </div>
    );
}

export default TienHanhDatHang;