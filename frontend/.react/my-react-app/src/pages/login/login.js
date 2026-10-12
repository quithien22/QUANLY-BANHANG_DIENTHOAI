import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './login.css';

import anhbanner from '../../images/banner_samsungs26ul.png';
import Footer from "../footer/footer";
import LoginGoogle from './login_google';

function Login() {
    const navigate = useNavigate();

    // 1. KHAI BÁO STATE LƯU DỮ LIỆU INPUT
    // Nếu lần trước có tick "Ghi nhớ đăng nhập" thì tự điền sẵn tài khoản (KHÔNG lưu mật khẩu)
    const [taiKhoan, setTaiKhoan] = useState(localStorage.getItem("taiKhoanGhiNho") || ""); // Dùng chung cho cả Email hoặc SĐT
    const [matKhau, setMatKhau] = useState("");
    const [ghiNho, setGhiNho] = useState(localStorage.getItem("ghiNhoDangNhap") === "1");
    const [thongBaoLoi, setThongBaoLoi] = useState(""); // State hiển thị lỗi màu đỏ

    // XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE (Backend đã xác thực, trả về userInfo)
    const xuLyDangNhapGoogleThanhCong = (userInfo) => {
        setThongBaoLoi("");
        localStorage.setItem("userData", JSON.stringify(userInfo));

        if (ghiNho) {
            localStorage.setItem("ghiNhoDangNhap", "1");
        } else {
            localStorage.removeItem("ghiNhoDangNhap");
        }
        // Đăng nhập Google không dùng mật khẩu nên không nhớ sẵn tài khoản ở ô nhập
        localStorage.removeItem("taiKhoanGhiNho");
        sessionStorage.setItem("phienDangNhap", "1");

        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Đăng nhập bằng Google thành công.',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            navigate("/home");
        });
    };

    const xuLyDangNhap = async (e) => {
        e.preventDefault();

        // Reset lỗi mỗi lần bấm nút
        setThongBaoLoi("");

        // 2. RÀNG BUỘC (VALIDATION) FRONTEND
        if (!taiKhoan.trim() || !matKhau.trim()) {
            setThongBaoLoi("Vui lòng nhập đầy đủ Email/Số điện thoại và mật khẩu!");
            return;
        }

        // Nếu người dùng nhập Email (có chứa dấu @)
        if (taiKhoan.includes('@')) {
            if (!taiKhoan.toLowerCase().endsWith("@gmail.com")) {
                setThongBaoLoi("Vui lòng sử dụng tài khoản Email có đuôi @gmail.com!");
                return;
            }
        }
        // Nếu người dùng nhập Số điện thoại (không có dấu @)
        else {
            const regexSDT = /^(0[3|5|7|8|9])+([0-9]{8})$/;
            if (!regexSDT.test(taiKhoan)) {
                setThongBaoLoi("Tài khoản không hợp lệ (Phải là SĐT 10 số hoặc Email @gmail.com)!");
                return;
            }
        }

        if (matKhau.length < 6) {
            setThongBaoLoi("Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }
        // 3. GỌI API ĐĂNG NHẬP (BACKEND)
        try {
            const response = await axios.post("http://localhost:8080/api/user/dang-nhap", {
                taiKhoan: taiKhoan,
                matKhau: matKhau
            });

            if (response.status === 200) {
                // Lưu thông tin khách hàng vào trình duyệt
                localStorage.setItem("userData", JSON.stringify(response.data.userInfo));

                // Xử lý ghi nhớ đăng nhập
                if (ghiNho) {
                    // Giữ đăng nhập lâu dài + nhớ tài khoản cho lần sau
                    localStorage.setItem("ghiNhoDangNhap", "1");
                    localStorage.setItem("taiKhoanGhiNho", taiKhoan.trim());
                } else {
                    // Chỉ giữ đăng nhập trong phiên hiện tại (đóng trình duyệt sẽ tự đăng xuất)
                    localStorage.removeItem("ghiNhoDangNhap");
                    localStorage.removeItem("taiKhoanGhiNho");
                }
                sessionStorage.setItem("phienDangNhap", "1");

                // Hiển thị Tick xanh thành công
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: 'Đăng nhập thành công.',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    navigate("/home"); 
                });
            }
        } catch (error) {
            // Bắt lỗi từ Backend trả về (Ví dụ: Sai mật khẩu, tài khoản không tồn tại)
            if (error.response && error.response.data.message) {
                setThongBaoLoi(error.response.data.message);
            } else {
                setThongBaoLoi("Lỗi kết nối đến máy chủ!");
            }
            console.error(error);
        }
    };

    // XU LY ENTER 
    const xuLyEnter = ()=> {
        console.log("Đăng nhập với nút enter", taiKhoan);
    }

    const xuLyPhimEnter = (e) => {
        if (e.key === 'Enter'){
            xuLyEnter();
        }
    }

    return (
        <>
            <div className='login-page'>
                {/* Header Đăng nhập */}
                <div className='login-header'>
                    <div className='login-header-left'>
                        <ul>
                            <li className='login-logo'>
                                <span>6AEStore</span>
                            </li>
                            <li className='login-page-login'>Đăng nhập</li>
                        </ul>
                    </div>

                    <div className='login-header-right'>
                        <ul>
                            <li>
                                <i className="bx bx-message-circle-question-mark" />
                                <Link to="/support">Hỗ trợ</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Nội dung chính */}
                <div className='login-content'>
                    {/* Phần giới thiệu bên trái */}
                    <div className='login-intro'>
                        <img src={anhbanner} alt="Banner" className="intro-img" />
                        <div className="intro-overlay">
                            <span className='intro-brand'>6AEStore</span>
                            <span className='intro-title'>ĐĂNG NHẬP THÀNH VIÊN</span>
                            <span className='intro-desc'>
                                Tích điểm Smember, nhận ngập tràn ưu đãi<br /> giảm giá độc quyền, quà tặng sinh nhật cực chất.
                            </span>
                        </div>
                    </div>

                    {/* Form đăng nhập bên phải */}
                    <div className='login-box'>
                        <div className='login-box-header'>
                            <h3>Đăng nhập</h3>
                        </div>

                        {/* HIỂN THỊ THÔNG BÁO LỖI Ở ĐÂY */}
                        {thongBaoLoi && (
                            <div style={{ color: "red", fontSize: "13px", fontWeight: "600", marginBottom: "15px", textAlign: "center" }}>
                                {thongBaoLoi}
                            </div>
                        )}

                        <form className='login-form' onSubmit={xuLyDangNhap}>
                            <ul>
                                <li>
                                    {/* LIÊN KẾT STATE taiKhoan VÀO INPUT */}
                                    <input
                                        className="input-field"
                                        type="text"
                                        placeholder='Email / SDT'
                                        value={taiKhoan}
                                        onChange={(e) => setTaiKhoan(e.target.value)}
                                    />
                                </li>
                                <li>
                                    {/* LIÊN KẾT STATE matKhau VÀO INPUT */}
                                    <input
                                        className="input-field"
                                        type="password"
                                        placeholder='Mật khẩu'
                                        value={matKhau}
                                        onChange={(e) => setMatKhau(e.target.value)}
                                        onKeyDown={xuLyPhimEnter}
                                    />
                                </li>
                                <li>
                                    <button type="submit" className="btn-submit">Đăng nhập</button>
                                </li>
                            </ul>

                            <div className='login-options'>
                                <label className='login-remember'>
                                    <input
                                        type="checkbox"
                                        checked={ghiNho}
                                        onChange={(e) => setGhiNho(e.target.checked)}
                                    />
                                    <span>Ghi nhớ đăng nhập</span>
                                </label>

                                <div className='login-forgot-pass'>Quên mật khẩu</div>
                            </div>

                            <div className='login-divider'>Hoặc</div>

                            <div className='login-social-group'>
                                <div className='social-buttons'>
                                    <button type="button" className='btn-social facebook'>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" />
                                        Facebook
                                    </button>
                                    
                                    <LoginGoogle
                                        onSuccess={xuLyDangNhapGoogleThanhCong}
                                        onError={(msg) => setThongBaoLoi(msg)}
                                    />
                                </div>

                                <div className='login-register-prompt'>
                                    <span>Chào bạn đã đến!</span>
                                    <Link to="/register" className='register-link'>Đăng ký</Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Login;