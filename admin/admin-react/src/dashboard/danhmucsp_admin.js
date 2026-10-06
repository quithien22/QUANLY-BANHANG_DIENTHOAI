import React, { useState, useEffect } from "react";
import "./danhmucsp_admin.css";
import axios from "axios";

function DanhMucSP() {
    const [danhSachDanhMuc, setDanhSachDanhMuc] = useState([]);
    const [hienModal, setHienModal] = useState(false);

    // Trạng thái phục vụ Thêm / Sửa
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [tenMoi, setTenMoi] = useState("");
    const [anhMoi, setAnhMoi] = useState("");

    // LẤY DANH SÁCH THƯƠNG HIỆU TỪ BACKEND
    const taiDanhSach = () => {
        axios.get("http://localhost:8080/api/thuonghieu")
            .then((response) => {
                const dataFormatted = response.data.map(item => ({
                    id: item.maThuongHieu,
                    name: item.tenThuongHieu,
                    img: item.hinhAnh,
                    soLuong: item.soLuong || 0,
                    isActive: item.trangThai === 1 || item.trangThai === true
                }));
                setDanhSachDanhMuc(dataFormatted);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiDanhSach();
    }, []);

    // HÀM BẬT / TẮT TRẠNG THÁI
    const toggleTrangThai = async (id, trangThaiHienTai) => {
        const trangThaiMoi = !trangThaiHienTai;

        try {
            const response = await axios.put(`http://localhost:8080/api/admin/thuonghieu/trangthai/${id}`, {
                trangThai: trangThaiMoi
            });

            if (response.data.success || response.status === 200) {
                setDanhSachDanhMuc(danhSachDanhMuc.map(dm =>
                    dm.id === id ? { ...dm, isActive: trangThaiMoi } : dm
                ));
            }
        } catch (error) {
            console.error("Lỗi khi thay đổi trạng thái:", error);
            alert("Không thể thay đổi trạng thái lúc này.");
        }
    };

    // MỞ MODAL Ở CHẾ ĐỘ THÊM MỚI
    const handleOpenAddModal = () => {
        setIsEditing(false);
        setEditId(null);
        setTenMoi("");
        setAnhMoi("");
        setHienModal(true);
    };

    // MỞ MODAL Ở CHẾ ĐỘ SỬA
    const handleOpenEditModal = (danhmuc) => {
        setIsEditing(true);
        setEditId(danhmuc.id);
        setTenMoi(danhmuc.name);
        setAnhMoi(danhmuc.img || "");
        setHienModal(true);
    };

    // HÀM XỬ LÝ SUBMIT FORM (DÙNG CHUNG CHO THÊM & SỬA)
    const handleSubmitForm = async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                // Gọi API Sửa danh mục
                const response = await axios.put(`http://localhost:8080/api/admin/thuonghieu/sua/${editId}`, {
                    tenThuongHieu: tenMoi,
                    hinhAnh: anhMoi
                });

                if (response.data.success || response.status === 200) {
                    alert("Cập nhật danh mục thành công!");
                    setHienModal(false);
                    taiDanhSach();
                }
            } else {
                // Gọi API Thêm danh mục mới
                const response = await axios.post("http://local host:8080/api/admin/thuonghieu/them", {
                    tenThuongHieu: tenMoi,
                    hinhAnh: anhMoi || "https://...."
                });

                if (response.data.success || response.status === 200) {
                    alert("Thêm danh mục thành công!");
                    setTenMoi("");
                    setAnhMoi("");
                    setHienModal(false);
                    taiDanhSach();
                }
            }
        } catch (error) {
            console.error("Lỗi xử lý form:", error);
            alert(isEditing ? "Cập nhật danh mục thất bại." : "Thêm danh mục thất bại.");
        }
    };

    // HÀM XÓA DANH MỤC
    const xoaDanhMuc = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) {
            try {
                const response = await axios.delete(`http://localhost:8080/api/admin/thuonghieu/xoa/${id}`);
                
                if (response.data.success || response.status === 200) {
                    alert("Xóa danh mục thành công!");
                    taiDanhSach(); // Tải lại danh sách
                }
            } catch (error) {
                console.error("Lỗi khi xóa:", error);
                alert("Không thể xóa danh mục này (có thể đang có sản phẩm liên kết).");
            }
        }
    };

    return (
        <div className="category-container">
            {/* KHU VỰC HEADER */}
            <ul className="category-header">
                <li className="header-text-wrapper">
                    <span className="category-title">Danh mục sản phẩm</span>
                    <label className="category-desc">Cấu trúc phân loại sản phẩm trên sàn thương mại điện tử</label>
                </li>
                <li className="header-action-wrapper">
                    <button className="btn-add-category" onClick={handleOpenAddModal}>
                        <i className="bx bx-plus" />
                        Thêm danh mục mới
                    </button>
                </li>
            </ul>

            {/* KHU VỰC DANH SÁCH (GRID) */}
            <ul className="category-grid">
                {danhSachDanhMuc.map((danhmuc, i) => (
                    <li className="category-card" key={danhmuc.id || i}>
                        <div className="category-card-top">
                            <div className="category-img-wrapper">
                                <img 
                                    src={danhmuc.img?.startsWith('http') ? danhmuc.img : `http://localhost:8080${danhmuc.img}`} 
                                    alt={danhmuc.name} 
                                    className="category-img" 
                                />
                            </div>
                            <button
                                className={`btn-toggle ${danhmuc.isActive ? 'active' : ''}`}
                                onClick={() => toggleTrangThai(danhmuc.id, danhmuc.isActive)}
                            >
                                {danhmuc.isActive ? 'Bật' : 'Tắt'}
                            </button>
                        </div>

                        <div className="category-card-mid">
                            <span className="category-name">{danhmuc.name}</span>
                            <label className="category-qty">{danhmuc.soLuong} sản phẩm</label>
                        </div>

                        <div className="category-card-bottom">
                            <label className="category-id">ID: {danhmuc.id}</label>
                            <div className="category-actions">
                                <button className="btn-action" onClick={() => handleOpenEditModal(danhmuc)} title="Sửa">
                                    <i className="bx bx-pencil icon-edit" />
                                </button>
                                <button className="btn-action" onClick={() => xoaDanhMuc(danhmuc.id)} title="Xóa">
                                    <i className="bx bx-trash icon-delete" />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* KHU VỰC FOOTER */}
            <div className="category-footer">
                <span className="category-count-text">
                    Hiển thị {danhSachDanhMuc.length} trên tổng số {danhSachDanhMuc.length} danh mục
                </span>
            </div>

            {/* MODAL THÊM / SỬA DANH MỤC */}
            {hienModal && (
                <div className="modal-overlay" onClick={() => setHienModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">{isEditing ? "Cập nhật danh mục" : "Thêm danh mục mới"}</span>
                            <button className="modal-close" onClick={() => setHienModal(false)}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitForm} className="modal-form">
                            <div className="modal-field">
                                <span>Tên danh mục</span>
                                <input
                                    type="text"
                                    value={tenMoi}
                                    onChange={(e) => setTenMoi(e.target.value)}
                                    placeholder="Nhập tên danh mục..."
                                    required
                                />
                            </div>

                            <div className="modal-field">
                                <span>Link ảnh danh mục</span>
                                <input
                                    type="text"
                                    value={anhMoi}
                                    onChange={(e) => setAnhMoi(e.target.value)}
                                    placeholder="Dán URL ảnh..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setHienModal(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-save">
                                    {isEditing ? "Lưu thay đổi" : "Lưu danh mục"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DanhMucSP;