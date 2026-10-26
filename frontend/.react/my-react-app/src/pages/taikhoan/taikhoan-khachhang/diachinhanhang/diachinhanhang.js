import React, { useState, useEffect } from "react";
import { addressApi } from "../../../../API/AddressApi";
import Swal from "sweetalert2";
import "./diachinhanhang.css";
import { Link } from "react-router-dom";


function DiaChiNhanHang() {
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    const [dsDiaChi, setDsDiaChi] = useState([]);
    const [dangTai, setDangTai] = useState(true);


    // State quản lý Toast thông báo góc phải
    const [thongBaoDung, setThongBaoDung] = useState(null);

    const hienThiThongBaoDung = (noiDung) => {
        setThongBaoDung(noiDung);
        setTimeout(() => {
            setThongBaoDung(null);
        }, 3000);
    };

    const [thongBaoSai, setThongBaoSai] = useState(null);

    const hienThiThongBaoSai = (noiDung) => {
        setThongBaoSai(noiDung);
        setTimeout(() => {
            setThongBaoSai(null);
        }, 3000);
    };


    // State quản lý Form bên phải
    const formMacDinh = { maDiaChi: null, hoTenNguoiNhan: "", SDT: "", diaChiChiTiet: "" };
    const [formDiaChi, setFormDiaChi] = useState(formMacDinh);
    const isEditing = formDiaChi.maDiaChi !== null; // Cờ nhận biết đang Sửa hay Thêm mới

    // Gọi API lấy danh sách
    const taiDanhSachDiaChi = () => {
        if (!maKH) return;
        setDangTai(true);
        addressApi.list(maKH)
            .then((data) => setDsDiaChi(data.data || []))
            .catch((error) => console.error("Lỗi lấy sổ địa chỉ:", error))
            .finally(() => setDangTai(false));
    };

    useEffect(() => { taiDanhSachDiaChi(); }, [maKH]);

    // Chuyển Form sang trạng thái Thêm mới
    const kichHoatThemMoi = () => {
        setFormDiaChi(formMacDinh);
    };

    // Chuyển Form sang trạng thái Sửa
    const kichHoatSua = (diaChi) => {
        setFormDiaChi({
            maDiaChi: diaChi.maDiaChi,
            hoTenNguoiNhan: diaChi.hoTenNguoiNhan,
            SDT: diaChi.SDT,
            diaChiChiTiet: diaChi.diaChiChiTiet
        });
    };

    // Xử lý Lưu (Dùng chung cho cả Thêm và Sửa)
    const xuLyLuuDiaChi = async () => {
        if (!formDiaChi.hoTenNguoiNhan || !formDiaChi.SDT || !formDiaChi.diaChiChiTiet) {
            hienThiThongBaoSai("Thiếu thông tin", "Vui lòng điền đầy đủ các trường!", "warning");
            return;
        }

        try {
            if (isEditing) {
                // Gọi API Sửa
                const data = await addressApi.update(formDiaChi.maDiaChi, formDiaChi);
                if (data.success) {
                    hienThiThongBaoDung("Thành công, Đã cập nhật địa chỉ");
                }
            } else {
                // Gọi API Thêm
                const data = await addressApi.add({
                    maKH: maKH,
                    hoTenNguoiNhan: formDiaChi.hoTenNguoiNhan,
                    SDT: formDiaChi.SDT,
                    diaChiChiTiet: formDiaChi.diaChiChiTiet
                });
                if (data.success) {
                    hienThiThongBaoDung("Thành công ,Đã thêm địa chỉ mới");
                }
            }
            kichHoatThemMoi(); // Reset form sau khi lưu xong
            taiDanhSachDiaChi(); // Tải lại danh sách
        } catch (error) {
            hienThiThongBaoSai("Lỗi", "Không thể lưu địa chỉ. Vui lòng thử lại!", "error");
        }
    };

    const xuLyDatMacDinh = async (maDiaChi) => {
        try {
            await addressApi.setDefault(maKH, maDiaChi);
            taiDanhSachDiaChi();
        } catch (error) {
            console.error(error);
        }
    };

    const xuLyXoaDiaChi = (maDiaChi) => {
        Swal.fire({
            title: "Xóa địa chỉ này?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#d33"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await addressApi.remove(maDiaChi);
                    taiDanhSachDiaChi();
                    // Nếu đang sửa chính địa chỉ vừa bị xóa thì reset form
                    if (formDiaChi.maDiaChi === maDiaChi) kichHoatThemMoi();
                } catch (error) {
                    const loiChiTiet = error.response?.data?.message || "Không thể xóa địa chỉ này.";
                    Swal.fire("Lỗi", loiChiTiet, "error");
                }
            }
        });
    };

    if (!maKH) return <div className="dc-empty">Vui lòng đăng nhập để xem sổ địa chỉ.</div>;

    return (
        <div className="dc-layout-grid">
            {thongBaoSai && (
                <div className="thong-bao-sai">
                    <i className="bx bx-alert-triangle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoSai}</span>
                </div>
            )}
            {thongBaoDung && (
                <div className="thong-bao-dung">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoDung}</span>
                </div>
            )}

            <div className="spyeuthich-breadcrumb">
                <Link to="/home"><span className="dc-breadcrumb_home">Trang chủ</span></Link>
                <i className="bx bx-chevron-right dc-breadcrumb-icon"></i>
                <Link to="/home/tai-khoan"><span className="dc-breadcrumb_link">Tài khoản</span></Link>
                <i className="bx bx-chevron-right dc-breadcrumb-icon"></i>
                <span className="dc-breadcrumb_current">Địa chỉ nhận hàng</span>
            </div>


            <div className="form_diachi">
                {/* CỘT TRÁI: DANH SÁCH ĐỊA CHỈ */}
                <div className="dc-left-panel">
                    <div className="dc-header">
                        <h2 className="dc-title">Địa chỉ của tôi</h2>
                        {/* Bấm nút này sẽ reset form bên phải về trạng thái Thêm */}
                        <button className="dc-btn-add" onClick={kichHoatThemMoi}>
                            <i className="bx bx-plus"></i> Thêm địa chỉ mới
                        </button>
                    </div>

                    <div className="dc-list-container">
                        {dangTai ? (
                            <div className="dc-empty">Đang tải danh sách...</div>
                        ) : dsDiaChi.length === 0 ? (
                            <div className="dc-empty">Bạn chưa lưu địa chỉ nào.</div>
                        ) : (
                            dsDiaChi.map((dc) => (
                                <div key={dc.maDiaChi} className={`dc-card ${dc.macDinh ? "dc-card-default" : ""}`}>
                                    <div className="dc-info">
                                        <div className="dc-name-row">
                                            <span className="dc-name">{dc.hoTenNguoiNhan}</span>
                                            <span className="dc-divider">|</span>
                                            <span className="dc-phone">{dc.SDT}</span>
                                            {dc.macDinh === true && <span className="dc-badge">Mặc định</span>}
                                        </div>
                                        <div className="dc-address-text">{dc.diaChiChiTiet}</div>
                                    </div>

                                    <div className="dc-actions">
                                        <div className="dc-action-links">
                                            {/* Bấm Sửa sẽ đẩy dữ liệu sang cột bên phải */}
                                            <span className="dc-link-edit" onClick={() => kichHoatSua(dc)}>Cập nhật</span>
                                            <span className="dc-link-del" onClick={() => xuLyXoaDiaChi(dc.maDiaChi)}>Xóa</span>
                                        </div>
                                        {!dc.macDinh && (
                                            <button className="dc-btn-set-default" onClick={() => xuLyDatMacDinh(dc.maDiaChi)}>
                                                Thiết lập mặc định
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI: FORM NHẬP LIỆU */}
                <div className="dc-right-panel">
                    <div className="dc-form-box">
                        <h3 className="dc-form-title">
                            {isEditing ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                        </h3>

                        <div className="dc-input-group">
                            <label>Họ và tên người nhận</label>
                            <input
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={formDiaChi.hoTenNguoiNhan}
                                onChange={(e) => setFormDiaChi({ ...formDiaChi, hoTenNguoiNhan: e.target.value })}
                            />
                        </div>

                        <div className="dc-input-group">
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                placeholder="Nhập số điện thoại"
                                value={formDiaChi.SDT}
                                onChange={(e) => setFormDiaChi({ ...formDiaChi, SDT: e.target.value })}
                            />
                        </div>

                        <div className="dc-input-group">
                            <label>Địa chỉ chi tiết</label>
                            <textarea
                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                                rows="4"
                                value={formDiaChi.diaChiChiTiet}
                                onChange={(e) => setFormDiaChi({ ...formDiaChi, diaChiChiTiet: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="dc-form-actions">
                            {isEditing && (
                                <button className="dc-btn-cancel" onClick={kichHoatThemMoi}>
                                    Hủy sửa
                                </button>
                            )}
                            <button className="dc-btn-save" onClick={xuLyLuuDiaChi}>
                                {isEditing ? "Lưu thay đổi" : "Lưu địa chỉ"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DiaChiNhanHang;