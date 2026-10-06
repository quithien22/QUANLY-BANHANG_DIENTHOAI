import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

import './register.css';
import anhbanner from '../../images/banner_registrer.png';
import Footer from "../footer/footer";

function Register() {
    const navigate = useNavigate();

    // 1. Khai báo state lưu trữ dữ liệu form
    const [taiKhoan, setTaiKhoan] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [thongBaoLoi, setThongBaoLoi] = useState("");

    // 2. Hàm xử lý đăng ký
    const xuLyDangKy = async (e) => {
        e.preventDefault(); // Ngăn trang bị reload khi submit form
        setThongBaoLoi("");

        // Kiểm tra validation cơ bản
        if (!taiKhoan.trim() || !matKhau.trim()) {
            setThongBaoLoi("Vui lòng nhập đầy đủ Email/Số điện thoại và Mật khẩu!");
            return;
        }

        if (matKhau.length < 6) {
            setThongBaoLoi("Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        // Gửi dữ liệu lên API Backend
        try {
            const response = await axios.post("http://localhost:8080/api/user/dang-ky", {
                taiKhoan: taiKhoan,
                matKhau: matKhau
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng ký thành công!',
                    text: 'Vui lòng bổ sung thông tin cá nhân để hoàn tất hồ sơ.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    // Chuyển hướng sang trang cập nhật thông tin, mang theo tài khoản vừa đăng ký
                    navigate("/login", { state: { taiKhoan: taiKhoan } });
                });
            }
        } catch (error) {
            // Hiển thị lỗi từ backend (VD: Tài khoản đã tồn tại)
            if (error.response && error.response.data.message) {
                setThongBaoLoi(error.response.data.message);
            } else {
                setThongBaoLoi("Lỗi kết nối đến máy chủ!");
            }
        }
    };

    return (
        <>
            <div className='register-page'>
                {/* Header Đăng ký */}
                <div className='register-header'>
                    <div className='register-header-left'>
                        <ul>
                            <li className='register-logo'>
                                <span>ThiệnStore</span>
                            </li>
                            <li className='register-page-title'>Đăng ký</li>
                        </ul>
                    </div>

                    <div className='register-header-right'>
                        <ul>
                            <li>
                                <i className="bx bx-message-circle-question-mark" />
                                <Link to="/support">Hỗ trợ</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Nội dung chính */}
                <div className='register-content'>
                    {/* Phần giới thiệu bên trái */}
                    <div className='register-intro'>
                        <img src={anhbanner} alt="Banner" className="register-intro-img" />

                        <div className="register-intro-overlay">
                            <span className='register-intro-brand'>ThiệnStore</span>
                            <span className='register-intro-title'>ĐĂNG KÝ THÀNH VIÊN</span>
                            <span className='register-intro-desc'>
                                Tích điểm Smember, nhận ngập tràn ưu đãi<br /> giảm giá độc quyền, quà tặng sinh nhật cực chất.
                            </span>
                        </div>
                    </div>

                    {/* Form đăng ký bên phải */}
                    <div className='register-box'>
                        <div className='register-box-header'>
                            <h3>Đăng ký</h3>
                        </div>

                        {/* Hiển thị lỗi ngay trên form */}
                        {thongBaoLoi && (
                            <div style={{ color: "red", fontSize: "13px", fontWeight: "600", marginBottom: "15px", textAlign: "center" }}>
                                {thongBaoLoi}
                            </div>
                        )}

                        {/* Dùng thẻ <form> để bắt sự kiện Enter */}
                        <form className='register-form' onSubmit={xuLyDangKy}>
                            <ul>
                                <li>
                                    <input 
                                        className="register-input-field" 
                                        type="text" 
                                        placeholder='Email / SDT' 
                                        value={taiKhoan}
                                        onChange={(e) => setTaiKhoan(e.target.value)}
                                    />
                                </li>
                                <li>
                                    <input 
                                        className="register-input-field" 
                                        type="password" 
                                        placeholder='Mật khẩu (từ 6 ký tự)' 
                                        value={matKhau}
                                        onChange={(e) => setMatKhau(e.target.value)}
                                    />
                                </li>
                                <li>
                                    <button type="submit" className="register-btn-submit">Đăng ký</button>
                                </li>
                            </ul>

                            <div className='register-divider'>Hoặc</div>

                            <div className='register-social-group'>
                                <div className='register-social-buttons'>
                                    <button type="button" className='register-btn-social facebook'>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" />
                                        Facebook
                                    </button>

                                    <button type="button" className='register-btn-social google'>
                                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRADNQjSQ8ExMidAPTxNmHJdtIOtn0eJaLAbJ1qa_zc8w&s=10" alt="Google" />
                                        Google
                                    </button>
                                </div>

                                <div className='register-prompt'>
                                    <span>Bạn đã có tài khoản?</span>
                                    <Link to="/login" className='register-login-link'>Đăng nhập</Link>
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

export default Register;