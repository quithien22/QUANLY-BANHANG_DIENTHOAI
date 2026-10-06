import React, { useState, useEffect } from "react";
import "./thongtinkhachhang.css";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

function ThongTinkhachHang() {
    const navigate = useNavigate();

    // 1. STATE LƯU TRỮ THÔNG TIN FORM
    const [userData, setUserData] = useState({});
    const [hoTen, setHoTen] = useState("");
    const [sdt, setSdt] = useState("");
    const [email, setEmail] = useState("");
    const [diaChi, setDiaChi] = useState("");

    // STATE MỚI ĐỂ BẬT/TẮT MODAL VÀ LƯU THÊM DỮ LIỆU
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gioiTinh, setGioiTinh] = useState("");
    const [ngaySinh, setNgaySinh] = useState("");

    // LẤY DỮ LIỆU TỪ LOCALSTORAGE KHI TRANG VỪA LOAD LÊN
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("userData") || "{}");

        if (!storedUser || !storedUser.maKH) {
            navigate("/login");
            return;
        }

        // 1. Đổ dữ liệu cũ từ LocalStorage ra form trước để giao diện tải nhanh
        setUserData(storedUser);
        setHoTen(storedUser.hoTen || "");
        setSdt(storedUser.sdt || "");
        setEmail(storedUser.email || "");
        setDiaChi(storedUser.diaChi || "");
        setGioiTinh(storedUser.gioiTinh || "Nam");
        setNgaySinh(storedUser.ngaySinh ? storedUser.ngaySinh.substring(0, 10) : "");

        axios.get(`http://localhost:8080/api/khachhang/${storedUser.maKH}`)
            .then(res => {
                if (res.data.success) {
                    const freshData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;

                    if (freshData) {
                        setUserData(prev => ({
                            ...prev,
                            diemTichLuy: freshData.diemTichLuy || 0,
                            tongDonHang: freshData.tongDonHang || 0
                        }));

                        const updatedStorage = {
                            ...storedUser,
                            diemTichLuy: freshData.diemTichLuy || 0,
                            tongDonHang: freshData.tongDonHang || 0
                        };
                        localStorage.setItem("userData", JSON.stringify(updatedStorage));
                    }
                }
            })
            .catch(err => console.error("Lỗi cập nhật điểm tích lũy và đơn hàng:", err));

    }, [navigate]);

    // XỬ LÝ ĐĂNG XUẤT
    const handleDangXuat = () => {
        Swal.fire({
            title: 'Xác nhận đăng xuất?',
            text: "Bạn có chắc chắn muốn thoát tài khoản không?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("userData");
                navigate("/home");
                window.location.reload();
            }
        });
    };

    // THAY DOI MAT KHAU
    const [matKhauCu, setMatKhauCu] = useState("");
    const [matKhauMoi, setMatKhauMoi] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
    const [hienMatKhauCu, setHienMatKhauCu] = useState(false);
    const [hienMatKhauMoi, setHienMatKhauMoi] = useState(false);
    const [hienXacNhanMatKhau, setHienXacNhanMatKhau] = useState(false);

    const handleDoiMatKhau = async () => {
        if (!matKhauCu || !matKhauMoi || !xacNhanMatKhau) {
            Swal.fire("Cảnh báo", "Vui lòng nhập đầy đủ thông tin mật khẩu!", "warning");
            return;
        }

        if (matKhauMoi !== xacNhanMatKhau) {
            Swal.fire("Cảnh báo", "Xác nhận mật khẩu không khớp với mật khẩu mới!", "warning");
            return;
        }

        if (matKhauMoi.length < 6) {
            Swal.fire("Cảnh báo", "Mật khẩu mới phải có ít nhất 6 ký tự!", "warning");
            return;
        }

        try {
            const response = await axios.put("http://localhost:8080/api/user/doi-mat-khau", {
                maKH: userData.maKH,
                matKhauCu: matKhauCu,
                matKhauMoi: matKhauMoi,
            });

            if (response.status === 200) {
                Swal.fire("Thành công!", "Đổi mật khẩu thành công.", "success");
                setMatKhauCu("");
                setMatKhauMoi("");
                setXacNhanMatKhau("");
            }
        } catch (error) {
            if (error.response && error.response.data.message) {
                Swal.fire("Lỗi!", error.response.data.message, "error");
            } else {
                Swal.fire("Lỗi!", "Hệ thống đang bận, vui lòng thử lại sau.", "error");
            }
        }
    };

    // LUU THONG TIN DANG NHAP
    const handleLuuThayDoi = async () => {
        try {
            const response = await axios.put("http://localhost:8080/api/user/cap-nhat-info", {
                maKH: userData.maKH,
                hoTen: hoTen,
                gioiTinh: gioiTinh,
                ngaySinh: ngaySinh,
                diaChi: diaChi,
                sdt: sdt,
                email: email
            });

            if (response.status === 200) {
                setIsModalOpen(false);

                const updatedUserData = {
                    ...userData,
                    hoTen: hoTen,
                    gioiTinh: gioiTinh,
                    ngaySinh: ngaySinh,
                    diaChi: diaChi,
                    sdt: sdt,
                    email: email
                };
                localStorage.setItem("userData", JSON.stringify(updatedUserData));
                setUserData(updatedUserData);

                Swal.fire("Thành công!", "Thông tin cá nhân đã được cập nhật.", "success");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Lỗi!", "Không thể cập nhật thông tin. Vui lòng thử lại sau.", "error");
        }
    };

    const dangHoatDong = userData.trangThai === 1;

    return (
        <div className="taikhoan-page">
            {/* BREADCRUMB */}
            <ul className="taikhoan-breadcrumb">
                <Link to = "/home">
                    <li className="taikhoan-breadcrumb_1">
                        <span>Trang chủ</span>
                        <i className="bx bx-chevron-right"></i>
                    </li>
                </Link>
              
                <li className="taikhoan-breadcrumb_2">
                    <span>Tài khoản khách hàng</span>
                </li>
            </ul>

            <ul className="taikhoan-content">
                {/* SIDEBAR BÊN TRÁI*/}
                <li className="taikhoan-sidebar-wrap">
                    <ul className="taikhoan-sidebar">
                        <li className="taikhoan-sidebar_user">
                            <div className="taikhoan-sidebar_avatar">
                                <i className="bx bx-user" />
                            </div>
                            <div className="taikhoan-sidebar_userinfo">
                                <span className="taikhoan-sidebar_username">{userData.hoTen}</span>
                                <span className="taikhoan-sidebar_rank">Hạng thành viên: Smember</span>
                            </div>
                        </li>
                        <li className="taikhoan-sidebar_item active">
                            <i className="bx bx-user" />
                            <span>Thông tin cá nhân</span>
                        </li>
                        <Link to="/home/tai-khoan/lich-su-mua-hang">
                            <li className="taikhoan-sidebar_item">
                                <i className='bx bx-shopping-bag'></i>
                                <span>Lịch sử mua hàng</span>
                            </li>
                        </Link>

                        <Link to="/home/tai-khoan/san-pham-yeu-thich">
                            <li className="taikhoan-sidebar_item">
                                <i className='bx bx-heart'></i>
                                <span>Danh sách yêu thích</span>
                            </li>
                        </Link>
                        <Link to="/home/tai-khoan/doi-tra-hang">
                            <li className="taikhoan-sidebar_item">
                                <i className="bx bx-refresh" />
                                <span>Đổi trả hàng</span>
                            </li>
                        </Link>
                        <Link to="/home/tai-khoan/dia-chi-nhan-hang">
                            <li className="taikhoan-sidebar_item">
                                <i className="bx bx-map-pin"></i>
                                <span>Địa chỉ nhận hàng</span>
                            </li>
                        </Link>
                        <li className="taikhoan-sidebar_item taikhoan-sidebar_logout" onClick={handleDangXuat} style={{ cursor: 'pointer' }}>
                            <i className='bx bx-log-out'></i>
                            <span>Đăng xuất tài khoản</span>
                        </li>
                    </ul>
                </li>

                {/* NỘI DUNG BÊN PHẢI */}
                <li className="taikhoan-main">

                    {/* BOX THÔNG TIN CÁ NHÂN - giờ hiển thị dạng thẻ thông tin, không dùng input cho dữ liệu chỉ-xem */}
                    <div className="taikhoan-box">
                        <span className="taikhoan-box_title">THÔNG TIN CÁ NHÂN</span>

                        <div className="tt-info-grid">
                            <div className="tt-info-item">
                                <span className="tt-info-label">Họ và tên</span>
                                <span className="tt-info-value">{userData.hoTen || "—"}</span>
                            </div>
                            <div className="tt-info-item">
                                <span className="tt-info-label">Tài khoản (SĐT hoặc Email)</span>
                                <span className="tt-info-value">{userData.sdt || userData.email || "—"}</span>
                            </div>
                            <div className="tt-info-item">
                                <span className="tt-info-label">Điểm tích lũy</span>
                                <span className="tt-info-value tt-value-cam">{userData.diemTichLuy || 0}</span>
                            </div>
                            <div className="tt-info-item">
                                <span className="tt-info-label">Tổng số đơn hàng</span>
                                <span className="tt-info-value tt-value-xanh">{userData.tongDonHang || 0}</span>
                            </div>
                            <div className="tt-info-item">
                                <span className="tt-info-label">Trạng thái tài khoản</span>
                                <span className={`tt-badge ${dangHoatDong ? "tt-badge-xanh" : "tt-badge-do"}`}>
                                    {dangHoatDong ? "Đang hoạt động" : "Tạm khóa"}
                                </span>
                            </div>
                        </div>

                        <div className="taikhoan-box_btnwrap">
                            <button type="button" className="taikhoan-box_btn" onClick={() => setIsModalOpen(true)}>CẬP NHẬT THÔNG TIN</button>
                        </div>
                    </div>

                    {/* BOX ĐỔI MẬT KHẨU (giữ nguyên - đây là input thật, cần nhập) */}
                    <div className="taikhoan-box">
                        <span className="taikhoan-box_title">ĐỔI MẬT KHẨU</span>
                        <ul className="taikhoan-box_form taikhoan-box_form-password taikhoan-box_form-password-padding">

                            <li className="taikhoan-box_field taikhoan-box_field-password">
                                <span>Mật khẩu cũ</span>
                                <div className="tk-password-wrapper">
                                    <input
                                        type={hienMatKhauCu ? "text" : "password"}
                                        placeholder="Nhập mật khẩu cũ"
                                        value={matKhauCu}
                                        onChange={(e) => setMatKhauCu(e.target.value)}
                                        className="tk-password-input"
                                    />
                                    <i
                                        className={`${hienMatKhauCu ? "bx bx-eye" : "bx bx-eye-slash"} tk-password-icon`}
                                        onClick={() => setHienMatKhauCu(!hienMatKhauCu)}
                                    />
                                </div>
                            </li>

                            <li className="taikhoan-box_field taikhoan-box_field-password">
                                <span>Mật khẩu mới</span>
                                <div className="tk-password-wrapper">
                                    <input
                                        type={hienMatKhauMoi ? "text" : "password"}
                                        placeholder="Nhập mật khẩu mới"
                                        value={matKhauMoi}
                                        onChange={(e) => setMatKhauMoi(e.target.value)}
                                        className="tk-password-input"
                                    />
                                    <i
                                        className={`${hienMatKhauMoi ? "bx bx-eye" : "bx bx-eye-slash"} tk-password-icon`}
                                        onClick={() => setHienMatKhauMoi(!hienMatKhauMoi)}
                                    />
                                </div>
                            </li>

                            <li className="taikhoan-box_field taikhoan-box_field-password">
                                <span>Xác nhận mật khẩu</span>
                                <div className="tk-password-wrapper">
                                    <input
                                        type={hienXacNhanMatKhau ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={xacNhanMatKhau}
                                        onChange={(e) => setXacNhanMatKhau(e.target.value)}
                                        className="tk-password-input"
                                    />
                                    <i
                                        className={`${hienXacNhanMatKhau ? "bx bx-eye" : "bx bx-eye-slash"} tk-password-icon`}
                                        onClick={() => setHienXacNhanMatKhau(!hienXacNhanMatKhau)}
                                    />
                                </div>
                            </li>

                        </ul>

                        <button className="taikhoan-box_btn" onClick={handleDoiMatKhau}>ĐỔI MẬT KHẨU</button>
                    </div>
                </li>
            </ul>

            {/* MODAL CẬP NHẬT THÔNG TIN */}
            {isModalOpen && (
                <div className="tk-modal-overlay">
                    <div className="tk-modal-container">
                        <div className="tk-modal-header">
                            <h3>Cập nhật thông tin khách hàng</h3>
                        </div>

                        <div className="tk-modal-grid">
                            <div className="tk-modal-group">
                                <label>Họ và tên</label>
                                <input type="text" value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
                            </div>
                            <div className="tk-modal-group">
                                <label>Giới tính</label>
                                <select value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="tk-modal-group">
                                <label>Ngày sinh</label>
                                <input type="date" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)} />
                            </div>
                            <div className="tk-modal-group">
                                <label>Địa chỉ</label>
                                <input type="text" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
                            </div>

                            <div className="tk-modal-group">
                                <label>Số điện thoại</label>
                                <input
                                    type="text"
                                    value={sdt || ""}
                                    onChange={(e) => setSdt(e.target.value)}
                                />
                            </div>
                            <div className="tk-modal-group">
                                <label>Email</label>
                                <input
                                    type="text"
                                    value={email || ""}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="tk-modal-group">
                                <label>Điểm tích lũy</label>
                                <input type="text" value={userData.diemTichLuy || "0"} disabled className="tk-input-disabled" />
                            </div>
                            <div className="tk-modal-group">
                                <label>Tổng đơn hàng</label>
                                <input type="text" value={userData.tongDonHang || "0"} disabled className="tk-input-disabled" />
                            </div>
                        </div>

                        <div className="tk-modal-footer">
                            <button type="button" className="tk-btn-close" onClick={() => setIsModalOpen(false)}>
                                Đóng
                            </button>
                            <button
                                type="button"
                                className="tk-btn-save"
                                onClick={handleLuuThayDoi}
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ThongTinkhachHang;