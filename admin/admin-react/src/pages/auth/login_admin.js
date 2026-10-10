import React, { useState, useEffect } from "react";
import "./login_admin.css";
import bannerimages from '../../images-admin/baner-login.png';
import axios from "axios";
import myVideo from "../../assets/back_ground_admin.mp4";
import Swal from 'sweetalert2';

function LoginAdmin() {
    // Gộp chung thành 1 state duy nhất là taiKhoan
    const [taiKhoan, setTaiKhoan] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [thongBaoLoi, setThongBaoLoi] = useState("");
    
    const [hienThiMatKhau, setHienThiMatKhau] = useState(false);
    const [ghiNho, setGhiNho] = useState(false);

    useEffect(() => {
        const savedTaiKhoan = localStorage.getItem("adminSavedTaiKhoan");
        const savedMK = localStorage.getItem("adminSavedMK");
        if (savedTaiKhoan && savedMK) {
            setTaiKhoan(savedTaiKhoan);
            setMatKhau(savedMK);
            setGhiNho(true);
        }
    }, []);

    const handleDangNhap = async (e) => {
        e.preventDefault();
        setThongBaoLoi("");

        if (!taiKhoan.trim() || !matKhau.trim()) {
            setThongBaoLoi("Vui lòng nhập đầy đủ thông tin đăng nhập!");
            return;
        }

        // KIỂM TRA THÔNG MINH: Chỉ ép kiểu @gmail.com NẾU người dùng đang nhập email (có dấu @)
        if (taiKhoan.includes("@") && !taiKhoan.trim().toLowerCase().endsWith("@gmail.com")) {
            setThongBaoLoi("Nếu dùng Email, tài khoản phải có định dạng @gmail.com!");
            return;
        }

        if (matKhau.length < 6) {
            setThongBaoLoi("Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        try {
            const response = await axios.post("http://localhost:8080/api/admin/dang-nhap", {
                taiKhoan: taiKhoan, // Truyền biến taiKhoan lên Backend
                matKhau: matKhau
            });

            if (response.status === 200) {
                if (ghiNho) {
                    localStorage.setItem("adminSavedTaiKhoan", taiKhoan);
                    localStorage.setItem("adminSavedMK", matKhau);
                } else {
                    localStorage.removeItem("adminSavedTaiKhoan");
                    localStorage.removeItem("adminSavedMK");
                }

                localStorage.setItem("adminData", JSON.stringify(response.data.adminInfo));

                try {
                    await axios.post("http://localhost:8080/api/chamcong/tu-dong", {
                        maNV: response.data.adminInfo.maNV
                    });
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
                    window.location.href = "/admin/dashboard";
                });
            }
        } catch (error) {
            if (error.response && error.response.data.message) {
                setThongBaoLoi(error.response.data.message);
            } else {
                setThongBaoLoi("Sai thông tin đăng nhập hoặc lỗi máy chủ!");
            }
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
                            <label htmlFor="remember" className="checkbox-label" style={{cursor: 'pointer'}}>Ghi nhớ đăng nhập</label>
                        </div>
                        <span className="forgot-password" onClick={handleQuenMatKhau} style={{ cursor: 'pointer' }}>
                            Quên mật khẩu?
                        </span>
                    </div>

                    <button  className="btn-submit" onClick={handleDangNhap}>
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