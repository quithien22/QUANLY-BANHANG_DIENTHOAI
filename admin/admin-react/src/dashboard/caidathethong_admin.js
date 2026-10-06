import React, { useState, useEffect, useRef } from "react";
import "./caidathethong_admin.css";
import axios from "axios";

function CaiDat_Admin() {

    // =============== THONG BAO THANH CONG ================ 
    const [thongBaoCaiDat, setThongBaoCaiDat] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoCaiDat(noiDung);
        setTimeout(() => {
            setThongBaoCaiDat(null);
        }, 3000);
    };

    // ================= LẤY THÔNG TIN QUYỀN HẠN TỪ LOCALSTORAGE =================
    const adminInfo = JSON.parse(localStorage.getItem("adminData") || "{}");
    const laGiamDoc = adminInfo.maCV === 'CV01'; // Giám đốc mới có quyền sửa Cửa hàng & Vận chuyển

    // Mục đang chọn ở menu trái
    const [mucDangChon, setMucDangChon] = useState("ho-so");

    const cacMucCaiDat = [
        { id: "ho-so", nhan: "Hồ sơ cá nhân", icon: "bx-user" },
        { id: "mat-khau", nhan: "Đổi mật khẩu", icon: "bx-lock-alt" },
        { id: "cua-hang", nhan: "Thông tin cửa hàng", icon: "bx-store" },
        { id: "van-chuyen", nhan: "Cấu hình vận chuyển", icon: "bx-truck" },
        { id: "dang-xuat", nhan: "Đăng xuất", icon: "bx-log-out" }, // Đã thêm mục đăng xuất
    ];

    // Xử lý đăng xuất
    const xuLyDangXuat = () => {
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
            localStorage.removeItem("adminData");
            window.location.href = "/login-admin";  
        }
    };

    // ============== HỒ SƠ CÁ NHÂN ===========
    const [hoSo, setHoSo] = useState({ hoTen: "", soDienThoai: "", email: "", anhDaiDien: "" });
    const inputAnhRef = useRef(null);

    const chonAnhDaiDien = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setHoSo({ ...hoSo, anhDaiDien: URL.createObjectURL(file), fileAnhMoi: file });
    };

    const xoaAnhDaiDien = () => {
        setHoSo({ ...hoSo, anhDaiDien: "", fileAnhMoi: null });
    };

    const luuHoSo = () => {
        axios.put("http://localhost:8080/api/caidat/hoso", { ...hoSo, maNV: adminInfo.maNV })
            .then(() => hienThiThongBao("Đã lưu thay đổi hồ sơ."))
            .catch((error) => console.error("Lỗi khi lưu hồ sơ:", error));
    };

    // ============== ĐỔI MẬT KHẨU ===========
    const [matKhau, setMatKhau] = useState({ hienTai: "", moi: "", xacNhan: "" });
    const [hienThiMK, setHienThiMK] = useState({ hienTai: false, moi: false, xacNhan: false });

    const capNhatMatKhau = (field, value) => {
        setMatKhau({ ...matKhau, [field]: value });
    };

    const doiHienThiMK = (field) => {
        setHienThiMK({ ...hienThiMK, [field]: !hienThiMK[field] });
    };

    const tinhDoManhMatKhau = (mk) => {
        if (!mk) return { phanTram: 0, nhan: "", mauLop: "" };
        let diem = 0;
        if (mk.length >= 8) diem++;
        if (/[A-Z]/.test(mk)) diem++;
        if (/[0-9]/.test(mk)) diem++;
        if (/[^A-Za-z0-9]/.test(mk)) diem++;
        if (diem <= 1) return { phanTram: 33, nhan: "Yếu", mauLop: "do" };
        if (diem <= 2) return { phanTram: 66, nhan: "Trung bình", mauLop: "cam" };
        return { phanTram: 100, nhan: "Mạnh", mauLop: "xanhla" };
    };

    const doManhMKMoi = tinhDoManhMatKhau(matKhau.moi);

    const capNhatMatKhauMoi = () => {
        if (!matKhau.hienTai || !matKhau.moi || !matKhau.xacNhan) {
            alert("Vui lòng nhập đầy đủ các trường mật khẩu.");
            return;
        }
        if (matKhau.moi !== matKhau.xacNhan) {
            alert("Mật khẩu xác nhận không khớp với mật khẩu mới.");
            return;
        }
        axios.put("http://localhost:8080/api/caidat/matkhau", {
            maNV: adminInfo.maNV, // Gửi maNV lên
            hienTai: matKhau.hienTai,
            moi: matKhau.moi,
        })
            .then(() => {
                hienThiThongBao("Đổi mật khẩu thành công.");
                setMatKhau({ hienTai: "", moi: "", xacNhan: "" });
            })
            .catch((error) => {
                alert(error.response?.data?.message || "Lỗi khi đổi mật khẩu.");
            });
    };

    // ============== THÔNG TIN CỬA HÀNG ===========
    const [cuaHang, setCuaHang] = useState({
        tenCuaHang: "", diaChi: "", hotline: "", logo: "", moTa: "",
    });
    const inputLogoRef = useRef(null);

    const capNhatCuaHang = (field, value) => {
        setCuaHang({ ...cuaHang, [field]: value });
    };

    const chonLogoCuaHang = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCuaHang({ ...cuaHang, logo: URL.createObjectURL(file), fileLogoMoi: file });
    };

    const luuThongTinCuaHang = () => {
        axios.put("http://localhost:8080/api/caidat/cuahang", cuaHang)
            .then(() => hienThiThongBao("Đã lưu thông tin cửa hàng."))
            .catch((error) => console.error("Lỗi khi lưu thông tin cửa hàng:", error));
    };

    // ============== CẤU HÌNH VẬN CHUYỂN ===========
    const [phiVanChuyenMacDinh, setPhiVanChuyenMacDinh] = useState("");
    const [nguongMienPhi, setNguongMienPhi] = useState("");
    const [donViHoTro, setDonViHoTro] = useState([
        { ma: "GHTK", ten: "Giao Hàng Tiết Kiệm", mauLop: "green", bat: true },
        { ma: "GHN", ten: "Giao Hàng Nhanh", mauLop: "blue", bat: true },
        { ma: "J&T", ten: "J&T Express", mauLop: "orange", bat: false },
    ]);

    const doiTrangThaiDonVi = (index) => {
        if (!laGiamDoc) return; // Chặn toggle nếu không phải giám đốc
        const banSao = [...donViHoTro];
        banSao[index] = { ...banSao[index], bat: !banSao[index].bat };
        setDonViHoTro(banSao);
    };

    const luuCauHinhVanChuyen = () => {
        axios.put("http://localhost:8080/api/caidat/vanchuyen", {
            phiMacDinh: phiVanChuyenMacDinh,
            nguongMienPhi: nguongMienPhi,
            donViHoTro: donViHoTro,
        })
            .then(() => hienThiThongBao("Đã lưu cấu hình vận chuyển."))
            .catch((error) => console.error("Lỗi khi lưu cấu hình vận chuyển:", error));
    };

    // ============== TẢI TOÀN BỘ CÀI ĐẶT KHI VÀO TRANG ===========
    useEffect(() => {
        axios.get(`http://localhost:8080/api/caidat?maNV=${adminInfo.maNV}`)
            .then((response) => {
                const d = response.data || {};
                if (d.hoSo) setHoSo((prev) => ({ ...prev, ...d.hoSo }));
                if (d.cuaHang) setCuaHang((prev) => ({ ...prev, ...d.cuaHang }));
                if (d.vanChuyen) {
                    setPhiVanChuyenMacDinh(d.vanChuyen.phiMacDinh ?? "");
                    setNguongMienPhi(d.vanChuyen.nguongMienPhi ?? "");
                    if (Array.isArray(d.vanChuyen.donViHoTro)) {
                        setDonViHoTro(d.vanChuyen.donViHoTro);
                    }
                }
            })
            .catch((error) => {
                console.error("Lỗi khi tải cài đặt hệ thống:", error);
            });
    }, []);

    return (
        <div className="cd-container">
            {/* HIEN THI THONG BAO */}
            {thongBaoCaiDat && (
                <div className="cai-dat">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoCaiDat}</span>
                </div>
            )}

            <div className="cd-header">
                <span className="cd-title">Cài đặt hệ thống</span>
                <label className="cd-subtitle">Quản lý thông tin hồ sơ, thay đổi bảo mật và cấu hình hệ thống bán lẻ</label>
            </div>

            <div className="cd-layout">
                {/* MENU TRÁI */}
                <div className="cd-menu">
                    {cacMucCaiDat.map((muc) => (
                        <button
                            key={muc.id}
                            className={`cd-menu-item ${mucDangChon === muc.id ? "active" : ""} ${muc.id === "dang-xuat" ? "text-danger" : ""}`}
                            onClick={() => muc.id === "dang-xuat" ? xuLyDangXuat() : setMucDangChon(muc.id)}
                            style={muc.id === "dang-xuat" ? { color: "#dc2626", marginTop: "auto", borderTop: "1px solid #e2e8f0" } : {}}
                        >
                            <i className={`bx ${muc.icon}`}></i>
                            {muc.nhan}
                        </button>
                    ))}
                </div>

                {/* NỘI DUNG BÊN PHẢI */}
                <div className="cd-content">

                    {/* HỒ SƠ CÁ NHÂN (Ai cũng sửa được) */}
                    {mucDangChon === "ho-so" && (
                        <div className="cd-card">
                            <span className="cd-card-title">Hồ sơ cá nhân</span>
                            {/* ... (Giữ nguyên phần render avatar và inputs của hồ sơ cá nhân) ... */}
                            <div className="cd-avatar-row">
                                <div className="cd-avatar-wrap">
                                    {hoSo.anhDaiDien ? (
                                        <img src={hoSo.anhDaiDien} alt="" className="cd-avatar-img" />
                                    ) : (
                                        <div className="cd-avatar-placeholder"><i className="bx bx-user"></i></div>
                                    )}
                                </div>
                                <div className="cd-avatar-actions">
                                    <div className="cd-avatar-buttons">
                                        <button className="cd-link-btn" onClick={() => inputAnhRef.current.click()}>Đổi ảnh đại diện</button>
                                        <button className="cd-link-btn cd-link-xoa" onClick={xoaAnhDaiDien}>Xóa ảnh</button>
                                        <input type="file" accept="image/*" ref={inputAnhRef} onChange={chonAnhDaiDien} hidden />
                                    </div>
                                    <span className="cd-hint">Hỗ trợ JPG, PNG. Dung lượng tối đa 2MB.</span>
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Họ và tên</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-user"></i>
                                    <input type="text" value={hoSo.hoTen} onChange={(e) => setHoSo({ ...hoSo, hoTen: e.target.value })} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Số điện thoại</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-phone"></i>
                                    <input type="text" value={hoSo.soDienThoai} onChange={(e) => setHoSo({ ...hoSo, soDienThoai: e.target.value })} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Email liên hệ</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-envelope"></i>
                                    <input type="email" value={hoSo.email} onChange={(e) => setHoSo({ ...hoSo, email: e.target.value })} />
                                </div>
                            </div>

                            <button className="cd-btn-luu" onClick={luuHoSo}><i className="bx bx-check"></i> Lưu thay đổi</button>
                        </div>
                    )}

                    {/* ĐỔI MẬT KHẨU (Ai cũng sửa được) */}
                    {mucDangChon === "mat-khau" && (
                        <div className="cd-card">
                            <span className="cd-card-title">Đổi mật khẩu bảo mật</span>
                            <div className="cd-field">
                                <label>Mật khẩu hiện tại</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-lock-alt"></i>
                                    <input type={hienThiMK.hienTai ? "text" : "password"} value={matKhau.hienTai} onChange={(e) => capNhatMatKhau("hienTai", e.target.value)} />
                                    <i className={`bx ${hienThiMK.hienTai ? "bx-hide" : "bx-show"} cd-icon-eye`} onClick={() => doiHienThiMK("hienTai")}></i>
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Mật khẩu mới</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-lock-alt"></i>
                                    <input type={hienThiMK.moi ? "text" : "password"} value={matKhau.moi} onChange={(e) => capNhatMatKhau("moi", e.target.value)} />
                                    <i className={`bx ${hienThiMK.moi ? "bx-hide" : "bx-show"} cd-icon-eye`} onClick={() => doiHienThiMK("moi")}></i>
                                </div>
                                {matKhau.moi && (
                                    <div className="cd-strength-row">
                                        <div className="cd-strength-track">
                                            <div className={`cd-strength-fill strength-${doManhMKMoi.mauLop}`} style={{ width: `${doManhMKMoi.phanTram}%` }}></div>
                                        </div>
                                        <div className="cd-strength-label-row">
                                            <span className="cd-hint">Độ mạnh mật khẩu</span>
                                            <span className={`cd-strength-text strength-text-${doManhMKMoi.mauLop}`}>{doManhMKMoi.nhan}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="cd-field">
                                <label>Xác nhận mật khẩu mới</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-lock-alt"></i>
                                    <input type={hienThiMK.xacNhan ? "text" : "password"} value={matKhau.xacNhan} onChange={(e) => capNhatMatKhau("xacNhan", e.target.value)} />
                                    <i className={`bx ${hienThiMK.xacNhan ? "bx-hide" : "bx-show"} cd-icon-eye`} onClick={() => doiHienThiMK("xacNhan")}></i>
                                </div>
                            </div>

                            <button className="cd-btn-luu" onClick={capNhatMatKhauMoi}><i className="bx bx-refresh"></i> Cập nhật mật khẩu</button>
                        </div>
                    )}

                    {/* THÔNG TIN CỬA HÀNG (Khóa đối với Nhân viên/Quản lý, chỉ Giám đốc sửa) */}
                    {mucDangChon === "cua-hang" && (
                        <div className="cd-card">
                            <span className="cd-card-title">Thông tin cửa hàng {laGiamDoc ? "" : "(Chỉ xem)"}</span>

                            <div className="cd-field">
                                <label>Tên cửa hàng / Sàn Giao Dịch</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-store"></i>
                                    <input type="text" value={cuaHang.tenCuaHang} onChange={(e) => capNhatCuaHang("tenCuaHang", e.target.value)} disabled={!laGiamDoc} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Địa chỉ văn phòng / Kho chính</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-map"></i>
                                    <input type="text" value={cuaHang.diaChi} onChange={(e) => capNhatCuaHang("diaChi", e.target.value)} disabled={!laGiamDoc} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Hotline hỗ trợ khách hàng</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-phone"></i>
                                    <input type="text" value={cuaHang.hotline} onChange={(e) => capNhatCuaHang("hotline", e.target.value)} disabled={!laGiamDoc} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Logo hiển thị sàn</label>
                                <div
                                    className="cd-upload-box"
                                    onClick={() => laGiamDoc && inputLogoRef.current.click()}
                                    style={{ cursor: laGiamDoc ? 'pointer' : 'not-allowed', opacity: laGiamDoc ? 1 : 0.7 }}
                                >
                                    {cuaHang.logo ? (
                                        <img src={cuaHang.logo} alt="Logo" className="cd-logo-preview" />
                                    ) : (
                                        <>
                                            <i className="bx bx-camera"></i>
                                            <span>Chọn file ảnh làm logo của hàng</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" ref={inputLogoRef} onChange={chonLogoCuaHang} hidden disabled={!laGiamDoc} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Mô tả ngắn ở footer trang khách hàng</label>
                                <textarea
                                    className="cd-textarea"
                                    rows="3"
                                    value={cuaHang.moTa}
                                    onChange={(e) => capNhatCuaHang("moTa", e.target.value)}
                                    disabled={!laGiamDoc}
                                />
                            </div>

                            {/* Chỉ hiển thị nút Lưu khi là Giám đốc */}
                            {laGiamDoc && (
                                <button className="cd-btn-luu" onClick={luuThongTinCuaHang}>
                                    <i className="bx bx-check"></i> Lưu thông tin cửa hàng
                                </button>
                            )}
                        </div>
                    )}

                    {/* CẤU HÌNH VẬN CHUYỂN (Khóa đối với Nhân viên/Quản lý, chỉ Giám đốc sửa) */}
                    {mucDangChon === "van-chuyen" && (
                        <div className="cd-card">
                            <span className="cd-card-title">Cấu hình vận chuyển & Giao vận {laGiamDoc ? "" : "(Chỉ xem)"}</span>

                            <div className="cd-field">
                                <label>Phí vận chuyển mặc định (VNĐ)</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-package"></i>
                                    <input type="number" value={phiVanChuyenMacDinh} onChange={(e) => setPhiVanChuyenMacDinh(e.target.value)} disabled={!laGiamDoc} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Ngưỡng miễn phí vận chuyển (VNĐ)</label>
                                <div className="cd-input-icon">
                                    <i className="bx bx-money"></i>
                                    <input type="number" value={nguongMienPhi} onChange={(e) => setNguongMienPhi(e.target.value)} disabled={!laGiamDoc} />
                                </div>
                            </div>

                            <div className="cd-field">
                                <label>Nhà đơn vị vận chuyển hỗ trợ</label>
                                <div className="cd-donvi-list">
                                    {donViHoTro.map((dv, i) => (
                                        <div className="cd-donvi-row" key={dv.ma}>
                                            <div className="cd-donvi-left">
                                                <span className={`cd-badge-donvi dv-${dv.mauLop}`}>{dv.ma}</span>
                                                <span className="cd-donvi-ten">{dv.ten}</span>
                                            </div>
                                            <button
                                                className={`cd-toggle ${dv.bat ? "on" : ""}`}
                                                onClick={() => doiTrangThaiDonVi(i)}
                                                disabled={!laGiamDoc}
                                                style={{ cursor: laGiamDoc ? 'pointer' : 'not-allowed', opacity: laGiamDoc ? 1 : 0.6 }}
                                            >
                                                <span className="cd-toggle-knob"></span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chỉ hiển thị nút Lưu khi là Giám đốc */}
                            {laGiamDoc && (
                                <button className="cd-btn-luu" onClick={luuCauHinhVanChuyen}>
                                    <i className="bx bx-check"></i> Lưu cấu hình vận chuyển
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CaiDat_Admin;