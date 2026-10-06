import React, { useState, useEffect } from "react";
import "./chitietdonhang.css";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

function ChiTietDonHang() {
    const [danhSachDonHang, setDanhSachDonHang] = useState([]);
    const [dangTai, setDangTai] = useState(true);

    // Lấy thông tin user đăng nhập (ĐÃ SỬA BỎ CHỖ || "KH01" GÂY LỖI)
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH; 

    useEffect(() => {
        // Nếu không có người dùng, tắt trạng thái loading và dừng lại ngay
        if (!maKH) {
            setDangTai(false);
            return;
        }

        setDangTai(true);
        axios.get(`http://localhost:8080/api/hoadon/khachhang/${maKH}`)
            .then(response => {
                setDanhSachDonHang(response.data);
            })
            .catch(error => console.error("Lỗi tải lịch sử đơn hàng:", error))
            .finally(() => setDangTai(false));
    }, [maKH]);

    // Các hàm Helper định dạng dữ liệu
    const dinhDangTien = (tien) => `${(Number(tien) || 0).toLocaleString("vi-VN")}đ`;
    const dinhDangNgay = (chuoiNgay) => {
        if (!chuoiNgay) return "";
        const date = new Date(chuoiNgay);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const layTenTrangThai = (maTrangThai) => {
        switch (maTrangThai) {
            case 'cho_xac_nhan': return { ten: 'Chờ xác nhận', mau: '#F59E0B', bg: '#FEF3C7' }; // Vàng
            case 'xac_nhan': return { ten: 'Đã xác nhận', mau: '#3B82F6', bg: '#DBEAFE' }; // Xanh dương nhạt
            case 'dang_giao': return { ten: 'Đang vận chuyển', mau: '#1D4ED8', bg: '#EFF6FF' }; // Xanh đậm
            case 'hoan_tat': return { ten: 'Đã hoàn tất', mau: '#10B981', bg: '#D1FAE5' }; // Xanh lá
            case 'da_huy': return { ten: 'Đã hủy', mau: '#EF4444', bg: '#FEE2E2' }; // Đỏ
            default: return { ten: 'Đang xử lý', mau: '#6B7280', bg: '#F3F4F6' };
        }
    };

    // ======== GIAO DIỆN CHẶN NGƯỜI DÙNG ========
    if (dangTai) {
        return <div className="chitietdonhang-page" style={{ textAlign: 'center', padding: '50px' }}><h3>Đang tải dữ liệu đơn hàng...</h3></div>;
    }

  if (!maKH) {
        return (
            <div className="add-cart">
                <p className="add-cart-trang-thai">
                    Bạn cần <Link to="/login">đăng nhập</Link> để xem đơn hàng.
                </p>
            </div>
        );
    }

    if (danhSachDonHang.length === 0) {
        return (
            <div className="add-cart">
                <p className="add-cart-trang-thai">
                    Bạn chưa có đơn hàng nào. <Link to="/home">Tiếp tục mua sắm</Link>
                </p>
            </div>
        );
    }
    // ============================================

    // ======== HÀM XỬ LÝ HỦY ĐƠN HÀNG ========
    const xuLyHuyDonHang = async (maHoaDon) => {
        // 1. Hiển thị popup hỏi xác nhận
        const xacNhan = await Swal.fire({
            title: 'Xác nhận hủy đơn?',
            text: "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444', // Màu đỏ
            cancelButtonColor: '#9CA3AF',  // Màu xám
            confirmButtonText: 'Đồng ý hủy',
            cancelButtonText: 'Đóng'
        });

        if (xacNhan.isConfirmed) {
            try {
                // 2. Gọi API gửi yêu cầu hủy xuống Backend
                const response = await axios.put(`http://localhost:8080/api/hoadon/huy-don/${maHoaDon}`);

                if (response.data.success) {
                    Swal.fire('Thành công!', 'Đơn hàng đã được hủy.', 'success');

                    // 3. Cập nhật lại state lập tức để đổi màu UI sang "Đã hủy" (không cần load lại trang)
                    setDanhSachDonHang(danhSachCu =>
                        danhSachCu.map(don =>
                            don.maHoaDon === maHoaDon ? { ...don, trangThai: 'da_huy' } : don
                        )
                    );
                }
            } catch (error) {
                console.error("Lỗi khi hủy đơn:", error);
                Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể hủy đơn hàng lúc này.', 'error');
            }
        }
    };

    return (
        <div className="chitietdonhang-page">
            <ul className="chitietdonhang-breadcrumb">
                <li className="chitietdonhang-breadcrumb_item">
                    <span className="chitietdonhang-breadcrumb_item-tc">Trang chủ</span>
                    <i className="bx bx-chevron-right"></i>
                </li>
                <li className="chitietdonhang-breadcrumb_item ">
                    <span className="chitietdonhang-breadcrumb_item-dh">Đơn hàng của bạn</span>
                </li>
            </ul>

            {/* DUYỆT QUA TỪNG ĐƠN HÀNG */}
            {danhSachDonHang.map((donHang, index) => {
                const trangThai = layTenTrangThai(donHang.trangThai);
                return (
                    <ul className="chitietdonhang-container" key={index} style={{ borderBottom: "2px dashed #E5E7EB", paddingBottom: "20px", marginBottom: "20px" }}>
                        {/* CỘT TRÁI: CHI TIẾT ĐƠN & SẢN PHẨM */}
                        <li className="chitietdonhang-main">
                            <div className="chitietdonhang-status_box">
                                <ul className="chitietdonhang-status_list">
                                    <li className="chitietdonhang-status_header">
                                        <div className="chitietdonhang-status_title">
                                            <span className="chitietdonhang-status_id">ĐƠN HÀNG #{donHang.maHoaDon}</span>
                                            <span className="chitietdonhang-status_date">Đặt ngày: {dinhDangNgay(donHang.thoiGianLap)}</span>
                                        </div>
                                        <span className="chitietdonhang-status_badge" style={{ color: trangThai.mau, backgroundColor: trangThai.bg }}>
                                            {trangThai.ten}
                                        </span>
                                    </li>

                                    {/* Timeline động */}
                                    <li className="chitietdonhang-timeline">
                                        <div className="chitietdonhang-timeline_step">
                                            <i className="bx bx-check" />
                                            <span className="chitietdonhang-timeline_text">Đã đặt</span>
                                        </div>
                                        <div className="chitietdonhang-timeline_line"> </div>
                                        <div className="chitietdonhang-timeline_step">
                                            <i className={donHang.trangThai === 'cho_xac_nhan' ? "bx bx-dots-horizontal-rounded" : "bx bx-check"} style={{ backgroundColor: donHang.trangThai === 'cho_xac_nhan' ? '#9CA3AF' : '#1D4ED8' }} />
                                            <span className="chitietdonhang-timeline_text">Xác nhận</span>
                                        </div>
                                        <div className="chitietdonhang-timeline_line" style={{ backgroundColor: ['dang_giao', 'hoan_tat'].includes(donHang.trangThai) ? '#1D4ED8' : '#E5E7EB' }}> </div>
                                        <div className="chitietdonhang-timeline_step">
                                            <i className="bx bx-truck" style={{ backgroundColor: ['dang_giao', 'hoan_tat'].includes(donHang.trangThai) ? '#1D4ED8' : '#9CA3AF' }} />
                                            <span className="chitietdonhang-timeline_text">Đang giao</span>
                                        </div>
                                        <div className="chitietdonhang-timeline_line" style={{ backgroundColor: donHang.trangThai === 'hoan_tat' ? '#1D4ED8' : '#E5E7EB' }}></div>
                                        <div className="chitietdonhang-timeline_step">
                                            <i className="bx bx-package" style={{ backgroundColor: donHang.trangThai === 'hoan_tat' ? '#1D4ED8' : '#9CA3AF' }} />
                                            <span className="chitietdonhang-timeline_text">{donHang.trangThai === 'hoan_tat' ? 'Đã giao' : 'Dự kiến'}</span>
                                            <span className="chitietdonhang-timeline_time">{donHang.ngayGiaoDuKien ? dinhDangNgay(donHang.ngayGiaoDuKien) : ''}</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="chitietdonhang-product_box">
                                <span className="chitietdonhang-product_headertitle">SẢN PHẨM ĐÃ MUA</span>
                                <ul className="chitietdonhang-product_list">
                                    {donHang.chiTietSanPham && donHang.chiTietSanPham.map((sp, spIndex) => (
                                        <li className="chitietdonhang-product_item" key={spIndex}>
                                            <div className="chitietdonhang-product_info">
                                                <img
                                                    src={sp.hinhAnh?.startsWith('http') ? sp.hinhAnh : `http://localhost:8080${sp.hinhAnh}`}
                                                    alt={sp.tenSP}
                                                    className="chitietdonhang-product_img"
                                                />
                                                <div className="chitietdonhang-product_details">
                                                    <span className="chitietdonhang-product_name">{sp.tenSP} {sp.mauSac ? `- ${sp.mauSac}` : ''}</span>
                                                    <span className="chitietdonhang-product_qty">Số lượng: {sp.soLuong}</span>
                                                </div>
                                            </div>
                                            <div className="chitietdonhang-product_price_wrap">
                                                <span className="chitietdonhang-product_price_current">{dinhDangTien(sp.giaBan)}</span>
                                            </div>
                                        </li>
                                    ))}

                                    <li className="chitietdonhang-product_footer">
                                        <ul className="chitietdonhang-footer_layout">
                                            <li className="chitietdonhang-footer_actions">
                                                {donHang.trangThai === 'cho_xac_nhan' && (
                                                    <button
                                                        className="chitietdonhang-btn_cancel"
                                                        onClick={() => xuLyHuyDonHang(donHang.maHoaDon)}
                                                    >
                                                        Yêu cầu Hủy đơn hàng
                                                    </button>
                                                )}
                                                <button className="chitietdonhang-btn_chat">Chat với hỗ trợ</button>
                                            </li>
                                            <li className="chitietdonhang-footer_totalwrap">
                                                <span className="chitietdonhang-footer_totallabel">Tổng thanh toán:</span>
                                                <span className="chitietdonhang-footer_totalprice">{dinhDangTien(donHang.tongTien)}</span>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        {/* CỘT PHẢI: THÔNG TIN NHẬN HÀNG */}
                        <li className="chitietdonhang-sidebar">
                            <ul className="chitietdonhang-customer_box">
                                <li className="chitietdonhang-customer_header">
                                    <span className="chitietdonhang-customer_title">THÔNG TIN NHẬN HÀNG</span>
                                </li>
                                <li className="chitietdonhang-customer_row chitietdonhang-customer_row-pad">
                                    <span className="chitietdonhang-customer_label">Người nhận:</span>
                                    <span className="chitietdonhang-customer_value_bold">{donHang.hoTenNguoiNhan}</span>
                                </li>
                                <li className="chitietdonhang-customer_row chitietdonhang-customer_row-pad">
                                    <span className="chitietdonhang-customer_label">Số điện thoại:</span>
                                    <span className="chitietdonhang-customer_value_bold">{donHang.SDT}</span>
                                </li>
                                <li className="chitietdonhang-customer_row chitietdonhang-customer_row-pad">
                                    <span className="chitietdonhang-customer_label">Địa chỉ giao hàng:</span>
                                    <span className="chitietdonhang-customer_value">{donHang.diaChiChiTiet}</span>
                                </li>
                                <li className="chitietdonhang-customer_row chitietdonhang-customer_row-pad">
                                    <span className="chitietdonhang-customer_label">Hình thức thanh toán:</span>
                                    <span className="chitietdonhang-customer_value_highlight">
                                        {donHang.phuongThuc === 'cod' ? 'Thanh toán tiền mặt (COD)' :
                                            donHang.phuongThuc === 'momo' ? 'Ví điện tử MoMo / VNPay' :
                                                'Chuyển khoản ngân hàng'}
                                    </span>
                                </li>
                            </ul>
                        </li>
                    </ul>
                );
            })}
        </div>
    );
}

export default ChiTietDonHang;