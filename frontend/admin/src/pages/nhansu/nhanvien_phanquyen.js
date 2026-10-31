import React, { useState, useEffect } from "react";
import "./nhanvien_phanquyen.css";
import axios from "axios";

const QUYEN = {
    GIAM_DOC: 'CV01',
    QUAN_LY: 'CV02',
    NHAN_VIEN: 'CV03'
};



function NhanVien_PhanQuyen() {


    const [danhSachNhanVien, setdanhSachNhanVien] = useState([]);
    const [trangHienTai, setTrangHienTai] = useState(1);

    // ================= XÁC THỰC QUYỀN =================
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    const laGiamDoc = adminData.maCV === QUYEN.GIAM_DOC; // Xác định tài khoản có phải Giám đốc không

    // State quản lý Toast thông báo góc phải
    const [thongBaoPhanQuyen, setThongBaoPhanQuyen] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoPhanQuyen(noiDung);
        setTimeout(() => {
            setThongBaoPhanQuyen(null);
        }, 3000);
    };



    // ================= TẢI DỮ LIỆU =================
    const taiDanhSach = () => {
        axios.get("http://localhost:8080/api/nhanvien")
            .then((response) => {
                setdanhSachNhanVien(response.data);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiDanhSach();
    }, []);

    // ================= PHÂN TRANG =================
    const soLuongMotTrang = 10;
    const tongSoTrang = Math.ceil(danhSachNhanVien.length / soLuongMotTrang);
    const viTriBatDauTrang = (trangHienTai - 1) * soLuongMotTrang;
    const viTriHienThi = danhSachNhanVien.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongMotTrang);
    const danhSachTrang = Array.from({ length: tongSoTrang }, (_, i) => i + 1);

    // Dùng cho bảng phân quyền
    const danhSachChucVuDuyNhat = Array.from(
        new Map(danhSachNhanVien
            .filter(nv => nv.maCV)
            .map(nv => [nv.maCV, { maCV: nv.maCV, chucVu: nv.chucVu }])
        ).values()
    );

    // ================= XỬ LÝ 3 TRẠNG THÁI =================
    const formatTrangThai = (tt) => {
        switch (Number(tt)) {
            case 1: return { text: "Đang làm", class: "status-active" };
            case 2: return { text: "Nghỉ phép", class: "status-leave" };  
            default: return { text: "Nghỉ việc", class: "status-inactive" };
        }
    };

    // ================= XỬ LÝ MODAL THÊM / SỬA =================
    const [hienModalThem, setHienModalThem] = useState(false);
    const [nhanVienDangSua, setNhanVienDangSua] = useState(null);
    const [formData, setFormData] = useState({
        hoTen: "", ngaySinh: "", gioiTinh: "Nam", diaChi: "", SDT: "", email: "", maCV: "", matKhau: "", trangThai: 1
    });

    const moModalThem = () => {
        if (!laGiamDoc) return alert("Chỉ Giám đốc mới có quyền thêm nhân sự!");
        setNhanVienDangSua(null);
        setFormData({ hoTen: "", ngaySinh: "", gioiTinh: "Nam", diaChi: "", SDT: "", email: "", maCV: "", matKhau: "", trangThai: 1 });
        setHienModalThem(true);
    };

    const moModalSua = (nhanVien) => {
        if (!laGiamDoc) return alert("Chỉ Giám đốc mới có quyền sửa thông tin nhân sự!");
        setNhanVienDangSua(nhanVien);
        setFormData({
            ...nhanVien,
            ngaySinh: nhanVien.ngaySinh ? nhanVien.ngaySinh.split('T')[0] : "" // Cắt chuỗi để hiển thị đúng định dạng input type="date"
        });
        setHienModalThem(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ================= GỌI API THÊM / SỬA / XÓA =================
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        try {
            if (nhanVienDangSua) {
                // Gọi API Sửa (Cần viết route PUT /api/admin/nhanvien/sua/:id ở backend)
                await axios.put(`http://localhost:8080/api/admin/nhanvien/sua/${nhanVienDangSua.maNV}`, formData);
                hienThiThongBao("Cập nhật thông tin thành công!");
            } else {
                // Gọi API Thêm mới (Cần viết route POST /api/admin/nhanvien/them ở backend)
                await axios.post(`http://localhost:8080/api/admin/nhanvien/them`, formData);
                hienThiThongBao("Thêm nhân viên mới thành công!");
            }
            setHienModalThem(false);
            taiDanhSach();
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Thao tác thất bại! Vui lòng kiểm tra lại dữ liệu.");
        }
    };

    const handleXoaNhanVien = async (maNV) => {
        if (!laGiamDoc) return alert("Chỉ Giám đốc mới có quyền xóa tài khoản!");
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?")) {
            try {
                // Gọi API Xóa (Cần viết route DELETE /api/admin/nhanvien/xoa/:id ở backend)
                await axios.delete(`http://localhost:8080/api/admin/nhanvien/xoa/${maNV}`);
                hienThiThongBao("Đã xóa nhân viên thành công!");
                taiDanhSach();
            } catch (error) {
                console.error("Lỗi xóa:", error);
                alert("Không thể xóa. Nếu nhân viên đã có lịch sử đơn hàng, hãy chuyển trạng thái thành 'Nghỉ việc' thay vì xóa.");
            }
        }
    };

    return (
        <div className="nhanvien-container">

            {thongBaoPhanQuyen && (
                <div className="phan-quyen">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoPhanQuyen}</span>
                </div>
            )}

            <div className="nhanvien-wrapper">
                <div className="nhanvien-display">
                    <div className="nhanvien-header">
                        <h2 className="nhanvien-title">Nhân viên & Phân quyền</h2>
                        <p className="nhanvien-subtitle">Quản lý thông tin tài khoản nhân sự nội bộ và phân nhiệm quản trị</p>
                    </div>

                    <div className="nhanvien-toolbar">
                        {/* Nút Thêm bị ẩn nếu không phải Giám đốc */}
                        {laGiamDoc && (
                            <button className="btn-add" onClick={moModalThem}>
                                <i className="bx bx-plus" />
                                <span>Thêm nhân viên</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="nhanvien-table">
                        <thead>
                            <tr>
                                <th>Mã NV</th>
                                <th>Họ và tên</th>
                                <th>Chức vụ</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viTriHienThi.length > 0 ? (
                                viTriHienThi.map((nv, i) => {
                                    const sttInfo = formatTrangThai(nv.trangThai);
                                    return (
                                        <tr key={i} className="nhanvien-row">
                                            <td className="col-id">{nv.maNV}</td>
                                            <td className="col-name">
                                                <div className="name-wrapper">
                                                    {/* Avatar đã thêm vào DB trước đó */}
                                                    <img src={nv.avatar || "https://placehold.co/40"} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px', objectFit: 'cover' }} />
                                                    <span className="text-name">{nv.hoTen}</span>
                                                </div>
                                            </td>
                                            <td className="col-role">{nv.chucVu || nv.maCV}</td>
                                            <td className="col-phone">{nv.SDT}</td>
                                            <td className="col-email">{nv.email}</td>
                                            <td className="col-status">
                                                <span className={`status-badge ${sttInfo.class}`}>
                                                    {sttInfo.text}
                                                </span>
                                            </td>
                                            <td className="col-actions">
                                                <div className="action-group">
                                                    {/* Nút Sửa / Xóa mờ đi và khóa lại nếu không phải Giám đốc */}
                                                    <button className="btn-edit" onClick={() => moModalSua(nv)} disabled={!laGiamDoc} style={{ opacity: laGiamDoc ? 1 : 0.4, cursor: laGiamDoc ? 'pointer' : 'not-allowed' }}>
                                                        <i className="bx bx-pencil" /> Sửa
                                                    </button>
                                                    <button className="btn-delete" onClick={() => handleXoaNhanVien(nv.maNV)} disabled={!laGiamDoc} style={{ opacity: laGiamDoc ? 1 : 0.4, cursor: laGiamDoc ? 'pointer' : 'not-allowed' }}>
                                                        <i className="bx bx-trash" /> Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-table-message">Không có nhân viên nào trong danh sách.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FOOTER PHÂN TRANG */}
            <div className="nhanvien-page-pagination">
                <span>
                    Hiển thị {danhSachNhanVien.length === 0 ? 0 : viTriBatDauTrang + 1} - {Math.min(viTriBatDauTrang + soLuongMotTrang, danhSachNhanVien.length)} trên tổng số {danhSachNhanVien.length} nhân viên.
                </span>

                <div className="nhanvien-pagesp-pagination">
                    <button className="nhanvien-page-page_btn" onClick={() => setTrangHienTai(trangHienTai - 1)} disabled={trangHienTai === 1}>
                        <i className="bx bx-chevron-left"></i>
                    </button>

                    {danhSachTrang.map((soTrang) => (
                        <button key={soTrang} className={`nhanvien-page-page_btn ${trangHienTai === soTrang ? "active" : ""}`} onClick={() => setTrangHienTai(soTrang)}>
                            {soTrang}
                        </button>
                    ))}

                    <button className="nhanvien-page-page_btn" onClick={() => setTrangHienTai(trangHienTai + 1)} disabled={trangHienTai === tongSoTrang || tongSoTrang === 0}>
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* MODAL THÊM / SỬA */}
            {hienModalThem && (
                <div className="modal-overlay" onClick={() => setHienModalThem(false)}>
                    <div className="modal-box-nhanvien" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">
                            {nhanVienDangSua ? "Chỉnh sửa hồ sơ Nhân sự" : "Nhập hồ sơ Nhân sự mới"}
                        </h3>

                        <form className="nv-form" onSubmit={handleSubmitForm}>
                            <div className="nv-form-columns">
                                {/* CỘT 1 */}
                                <div className="nv-form-col">
                                    <span className="nv-section-title">1. Thông tin cá nhân</span>
                                    <div className="nv-field">
                                        <label>Họ và tên *</label>
                                        <input type="text" name="hoTen" value={formData.hoTen} onChange={handleFormChange} required />
                                    </div>
                                    <div className="nv-field-row">
                                        <div className="nv-field">
                                            <label>Ngày sinh *</label>
                                            <input type="date" name="ngaySinh" value={formData.ngaySinh} onChange={handleFormChange} required />
                                        </div>
                                        <div className="nv-field">
                                            <label>Giới tính *</label>
                                            <div className="nv-radio-group">
                                                <label><input type="radio" name="gioiTinh" value="Nam" checked={formData.gioiTinh === "Nam"} onChange={handleFormChange} /> Nam</label>
                                                <label><input type="radio" name="gioiTinh" value="Nữ" checked={formData.gioiTinh === "Nữ"} onChange={handleFormChange} /> Nữ</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="nv-field">
                                        <label>Địa chỉ thường trú *</label>
                                        <input type="text" name="diaChi" value={formData.diaChi} onChange={handleFormChange} required />
                                    </div>
                                    <div className="nv-field-row">
                                        <div className="nv-field">
                                            <label>Số điện thoại *</label>
                                            <input type="text" name="SDT" value={formData.SDT} onChange={handleFormChange} required />
                                        </div>
                                        <div className="nv-field">
                                            <label>Email nội bộ *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleFormChange} required />
                                        </div>
                                    </div>
                                </div>

                                {/* CỘT 2 */}
                                <div className="nv-form-col">
                                    <span className="nv-section-title">2. Thông tin hợp đồng & Công việc</span>
                                    <div className="nv-field-row">
                                        <div className="nv-field">
                                            <label>Mã Chức vụ *</label>
                                            <select name="maCV" value={formData.maCV} onChange={handleFormChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required>
                                                <option value="">-- Chọn chức vụ --</option>
                                                <option value="CV01">Giám đốc (CV01)</option>
                                                <option value="CV02">Quản lý (CV02)</option>
                                                <option value="CV03">Nhân viên (CV03)</option>
                                            </select>
                                        </div>
                                        <div className="nv-field">
                                            <label>Trạng thái nhân sự *</label>
                                            <select name="trangThai" value={formData.trangThai} onChange={handleFormChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                                <option value={1}>Đang làm</option>
                                                <option value={2}>Nghỉ phép</option>
                                                <option value={0}>Nghỉ việc</option>
                                            </select>
                                        </div>
                                    </div>

                                    {!nhanVienDangSua && (
                                        <div className="nv-field">
                                            <label>Mật khẩu khởi tạo *</label>
                                            <input type="password" name="matKhau" value={formData.matKhau} onChange={handleFormChange} required />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="nv-form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setHienModalThem(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu hồ sơ Nhân viên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =============== BẢNG PHÂN QUYỀN ======================= */}
            <div className="matrix-table-wrapper">
                <div className="matrix-container">
                    <span>Bảng Phân Quyền thành viên</span>
                    <label>Cấu hình chi tiết quyền Xem, Thêm, Sửa, Xóa tương ứng với từng nhóm vai trò</label>
                </div>

                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th className="col-role">VAI TRÒ / CHỨC NĂNG</th>
                            <th>XEM (VIEW)</th>
                            <th>THÊM (CREATE)</th>
                            <th>SỬA (UPDATE)</th>
                            <th>XÓA (DELETE)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {danhSachChucVuDuyNhat.length > 0 ? (
                            danhSachChucVuDuyNhat.map((cv, index) => {
                                const isGiamDoc = cv.maCV === QUYEN.GIAM_DOC;
                                const isQuanLy = cv.maCV === QUYEN.QUAN_LY;

                                return (
                                    <tr key={cv.maCV || index}>
                                        <td className="role-name">{cv.chucVu}</td>
                                        <td><input type="checkbox" defaultChecked={true} disabled={!laGiamDoc} /></td>
                                        <td><input type="checkbox" defaultChecked={isGiamDoc || isQuanLy} disabled={!laGiamDoc} /></td>
                                        <td><input type="checkbox" defaultChecked={isGiamDoc || isQuanLy} disabled={!laGiamDoc} /></td>
                                        <td><input type="checkbox" defaultChecked={isGiamDoc} disabled={!laGiamDoc} /></td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Chưa có dữ liệu chức vụ...</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="matrix-footer-fo">
                    <span className="footer-notice-title">
                        {laGiamDoc ? "Đã phát hiện thay đổi trong cấu hình phân quyền." : "Chỉ Giám Đốc mới có quyền thay đổi cấu hình này."}
                    </span>
                    <button
                        className="btn-save-roles-pq"
                        onClick={() => {
                            if (!laGiamDoc) {
                                alert("Bạn không có quyền thực hiện thao tác này!");
                                return;
                            }
                            hienThiThongBao("Đã lưu cấu hình phân quyền thành công!");
                            // Sau này bạn có thể viết axios.post ở đây để gửi dữ liệu lên Backend
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        Lưu phân quyền
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NhanVien_PhanQuyen;