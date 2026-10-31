import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login_admin.css";
import bannerimages from '../../images-admin/baner-login.png';
import myVideo from "../../assets/back_ground_admin.mp4";
import Swal from 'sweetalert2';

// Các lớp đối tượng (OOP) dùng cho trang đăng nhập
import { adminAuthApi } from "../../API/AdminAuthApi";
import { chamCongApi } from "../../API/ChamCongApi";
import { adminSession } from "../../utils/AdminSession";
import { adminLoginValidator } from "../../utils/AdminLoginValidator";

function LoginAdmin() {
    const navigate = useNavigate();

    // Nếu lần trước có tick "Ghi nhớ đăng nhập" thì tự điền sẵn tài khoản (KHÔNG lưu mật khẩu)
    const [taiKhoan, setTaiKhoan] = useState(adminSession.getRememberedAccount());
    const [matKhau, setMatKhau] = useState("");
    const [thongBaoLoi, setThongBaoLoi] = useState("");

    const [hienThiMatKhau, setHienThiMatKhau] = useState(false);
    const [ghiNho, setGhiNho] = useState(adminSession.getRememberedAccount() !== "");

    // Dọn mật khẩu cũ từng bị lưu dạng văn bản thường trong trình duyệt
    useEffect(() => {
        adminSession.removeLegacyPassword();
    }, []);

    const handleDangNhap = async (e) => {
        if (e) e.preventDefault();
        setThongBaoLoi("");

        // 1. Kiểm tra dữ liệu nhập
        const loi = adminLoginValidator.validate(taiKhoan, matKhau);
        if (loi) {
            setThongBaoLoi(loi);
            return;
        }

        // 2. Gọi API đăng nhập
        try {
            const data = await adminAuthApi.login(taiKhoan.trim(), matKhau);

            if (data.success) {
                // Lưu phiên đăng nhập + ghi nhớ tài khoản
                adminSession.save(data.adminInfo);
                adminSession.rememberAccount(taiKhoan, ghiNho);

                // Chấm công tự động (lỗi ở đây không được chặn việc đăng nhập)
                try {
                    await chamCongApi.chamCongTuDong(data.adminInfo.maNV);
                } catch (err) {
                    console.error("Lỗi gọi chấm công tự động ngầm:", err);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Đăng nhập vào hệ thống thành công.',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    navigate("/admin/dashboard");
                });
            }
        } catch (error) {
            // error là ApiError: error.message đã là thông báo từ backend (hoặc câu mặc định)
            setThongBaoLoi(error.message || "Sai thông tin đăng nhập hoặc lỗi máy chủ!");
            console.error(error);
        }
    };

    const handleQuenMatKhau = () => {
        Swal.fire({
            icon: 'info',
            title: 'Quên mật khẩu?',
            text: 'Vì lý do bảo mật hệ thống, vui lòng liên hệ Ban Giám Đốc hoặc Quản trị viên (Admin) để được cấp lại mật khẩu mới.',
            confirmButtonText: 'Đã hiểu',
            confirmButtonColor: '#2563eb'
        });
    };

    return (
        <div className="login-admin-container">
            <video className="video-background" autoPlay loop muted playsInline>
                <source src={myVideo} type="video/mp4" />
            </video>

            <ul className="login-admin-wrapper">
                <li className="login-panel-left">
                    <span className="brand-name">THIỆNSTORE</span>
                    <div className="brand-intro">
                        <span className="brand-title">Hệ thống Quản trị E-commerce thông minh</span>
                        <label className="brand-desc">
                            Quản lý kho hàng, xử lý đơn hàng nhanh chóng, và tối ưu doanh thu bán lẻ với các báo cáo trực quan tức thì.
                        </label>
                    </div>
                    <img className="brand-image" src={bannerimages} alt="ThienStore Admin Banner" />
                    <label className="brand-copyright">
                        © 2026 ThienStoreAdmin Portal. Phát triển bởi Thien Team.
                    </label>
                </li>

                <li className="login-panel-right">
                    <div className="form-header">
                        <span className="form-title">Đăng nhập quản trị</span>
                        <span className="form-subtitle">Dành cho nhân viên và quản lý hệ thống</span>
                    </div>

                    {thongBaoLoi && (
                        <div className="thong-bao-loi">
                            {thongBaoLoi}
                        </div>
                    )}

                    {/* Ô NHẬP TÀI KHOẢN DUY NHẤT */}
                    <div className="input-group">
                        <span className="input-label">Tài khoản đăng nhập</span>
                        <div className="input-wrapper">
                            <i className="bx bx-user input-icon" />
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Email, Số điện thoại ..."
                                value={taiKhoan}
                                onChange={(e) => setTaiKhoan(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <span className="input-label">Mật khẩu</span>
                        <div className="input-wrapper">
                            <i className="bx bx-lock input-icon" />
                            <input
                                className="input-field"
                                type={hienThiMatKhau ? "text" : "password"}
                                placeholder="Nhập mật khẩu..."
                                value={matKhau}
                                onChange={(e) => setMatKhau(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleDangNhap(e); }}
                            />
                            <i
                                className={`bx ${hienThiMatKhau ? 'bx-hide' : 'bx-show'} input-icon-eye`}
                                onClick={() => setHienThiMatKhau(!hienThiMatKhau)}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    <div className="form-options">
                        <div className="remember-me">
                            <input
                                className="checkbox-input"
                                type="checkbox"
                                id="remember"
                                checked={ghiNho}
                                onChange={(e) => setGhiNho(e.target.checked)}
                            />
                            <label htmlFor="remember" className="checkbox-label" style={{ cursor: 'pointer' }}>Ghi nhớ đăng nhập</label>
                        </div>
                        <span className="forgot-password" onClick={handleQuenMatKhau} style={{ cursor: 'pointer' }}>
                            Quên mật khẩu?
                        </span>
                    </div>

                    <button className="btn-submit" onClick={handleDangNhap}>
                        Đăng nhập
                    </button>

                    <label className="form-footer-text">
                        Hệ thống quản trị nội bộ ThienStoreAdmin
                    </label>
                </li>
            </ul>
        </div>
    );
}

export default LoginAdmin;
