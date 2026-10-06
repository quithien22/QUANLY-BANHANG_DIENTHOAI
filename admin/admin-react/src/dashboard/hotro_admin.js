import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./hotro_admin.css";

function HoTro() {
    const [danhMucFAQ, setDanhMucFAQ] = useState([]);
    
    // State cho form Danh Mục
    const [tenDanhMucMoi, setTenDanhMucMoi] = useState("");
    
    // State cho form Câu Hỏi (Bổ sung linkLienQuan và anhLienQuan)
    const [formCauHoi, setFormCauHoi] = useState({
        maDanhMuc: "", cauHoi: "", traLoi: "", thuTu: 1, linkLienQuan: "", anhLienQuan: ""
    });

    // 1. Lấy dữ liệu FAQ
    const taiDuLieuFAQ = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/faq");
            setDanhMucFAQ(res.data);
            // Mặc định chọn danh mục đầu tiên cho form câu hỏi
            if (res.data.length > 0 && !formCauHoi.maDanhMuc) {
                setFormCauHoi({ ...formCauHoi, maDanhMuc: res.data[0].maDanhMuc });
            }
        } catch (error) {
            console.error("Lỗi tải FAQ:", error);
        }
    };

    useEffect(() => {
        taiDuLieuFAQ();
    }, []);

    // 2. Thêm Danh Mục Mới
    const handleThemDanhMuc = async () => {
        if (!tenDanhMucMoi.trim()) return Swal.fire("Lỗi", "Vui lòng nhập tên danh mục!", "warning");
        try {
            await axios.post("http://localhost:8080/api/admin/faq/danhmuc", { tenDanhMuc: tenDanhMucMoi });
            Swal.fire("Thành công", "Đã thêm danh mục mới", "success");
            setTenDanhMucMoi("");
            taiDuLieuFAQ();
        } catch (error) {
            Swal.fire("Lỗi", "Không thể thêm danh mục", "error");
        }
    };

    // 3. Thêm Câu Hỏi Mới
    const handleThemCauHoi = async () => {
        if (!formCauHoi.maDanhMuc || !formCauHoi.cauHoi.trim() || !formCauHoi.traLoi.trim()) {
            return Swal.fire("Lỗi", "Vui lòng điền đủ thông tin câu hỏi cơ bản!", "warning");
        }
        try {
            await axios.post("http://localhost:8080/api/admin/faq/cauhoi", formCauHoi);
            Swal.fire("Thành công", "Đã thêm câu hỏi vào danh mục", "success");
            // Reset text và đính kèm, giữ nguyên danh mục
            setFormCauHoi({ ...formCauHoi, cauHoi: "", traLoi: "", linkLienQuan: "", anhLienQuan: "" }); 
            taiDuLieuFAQ();
        } catch (error) {
            Swal.fire("Lỗi", "Không thể thêm câu hỏi", "error");
        }
    };

    // 4. Xóa Câu Hỏi
    const handleXoaCauHoi = (maCauHoi) => {
        Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Đồng ý xóa'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:8080/api/admin/faq/cauhoi/${maCauHoi}`);
                    Swal.fire("Đã xóa", "Câu hỏi đã được xóa", "success");
                    taiDuLieuFAQ();
                } catch (error) {
                    Swal.fire("Lỗi", "Không thể xóa câu hỏi", "error");
                }
            }
        });
    };

    return (
        <div className="hotro-admin-container">
            <div className="hotro-header">
                <h2>Quản lý Trung tâm Trợ giúp (FAQ)</h2>
                <p>Thêm danh mục và cập nhật câu hỏi thường gặp cho khách hàng</p>
            </div>

            <div className="hotro-grid">
                {/* CỘT TRÁI: FORM THÊM DỮ LIỆU */}
                <div className="hotro-forms">
                    {/* Form Danh Mục */}
                    <div className="hotro-card">
                        <h3>1. Thêm Danh Mục Mới</h3>
                        <div className="hotro-input-group">
                            <input 
                                type="text" 
                                placeholder="Nhập tên danh mục (VD: Vận chuyển)" 
                                value={tenDanhMucMoi} 
                                onChange={(e) => setTenDanhMucMoi(e.target.value)} 
                            />
                            <button className="btn-add" onClick={handleThemDanhMuc}>+ Thêm Danh Mục</button>
                        </div>
                    </div>

                    {/* Form Câu Hỏi */}
                    <div className="hotro-card mt-20">
                        <h3>2. Thêm Câu Hỏi Mới</h3>
                        <div className="hotro-input-group">
                            <label>Chọn Danh Mục</label>
                            <select 
                                value={formCauHoi.maDanhMuc} 
                                onChange={(e) => setFormCauHoi({...formCauHoi, maDanhMuc: e.target.value})}
                            >
                                {danhMucFAQ.map(dm => (
                                    <option key={dm.maDanhMuc} value={dm.maDanhMuc}>{dm.tenDanhMuc}</option>
                                ))}
                            </select>

                            <label>Câu hỏi</label>
                            <input 
                                type="text" 
                                placeholder="Nhập câu hỏi..." 
                                value={formCauHoi.cauHoi} 
                                onChange={(e) => setFormCauHoi({...formCauHoi, cauHoi: e.target.value})} 
                            />

                            <label>Câu trả lời (Hỗ trợ xuống dòng)</label>
                            <textarea 
                                rows="4" 
                                placeholder="Nhập chi tiết câu trả lời..." 
                                value={formCauHoi.traLoi} 
                                onChange={(e) => setFormCauHoi({...formCauHoi, traLoi: e.target.value})} 
                            />

                            {/* BOX THÊM THÔNG TIN ĐÍNH KÈM (TÙY CHỌN) */}
                            <div style={{
                                marginTop: '15px', 
                                padding: '15px', 
                                backgroundColor: '#f8fafc', 
                                borderRadius: '8px', 
                                border: '1px dashed #cbd5e1'
                            }}>
                                <h4 style={{ marginBottom: '12px', color: '#334155', fontSize: '14px' }}>
                                    <i className='bx bx-link-alt'></i> Thông tin đính kèm bài viết (Tùy chọn)
                                </h4>
                                
                                <label style={{ fontSize: '13px', color: '#64748b' }}>Đường dẫn hình ảnh (URL)</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: https://domain.com/hinh-anh.jpg" 
                                    value={formCauHoi.anhLienQuan} 
                                    onChange={(e) => setFormCauHoi({...formCauHoi, anhLienQuan: e.target.value})} 
                                    style={{ marginBottom: '10px' }}
                                />

                                <label style={{ fontSize: '13px', color: '#64748b' }}>Đường dẫn bài viết chi tiết (URL)</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: https://tin-tuc.com/bai-viet-moi" 
                                    value={formCauHoi.linkLienQuan} 
                                    onChange={(e) => setFormCauHoi({...formCauHoi, linkLienQuan: e.target.value})} 
                                />
                            </div>

                            <button className="btn-add" onClick={handleThemCauHoi} style={{ marginTop: '20px' }}>
                                + Lưu Câu Hỏi
                            </button>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: XEM TRƯỚC VÀ QUẢN LÝ DỮ LIỆU */}
                <div className="hotro-preview">
                    <div className="hotro-card">
                        <h3>Danh sách Câu hỏi theo Danh mục</h3>
                        {danhMucFAQ.map(dm => (
                            <div key={dm.maDanhMuc} className="preview-category">
                                <h4 className="category-title"><i className='bx bx-folder'></i> {dm.tenDanhMuc}</h4>
                                <ul className="preview-question-list">
                                    {dm.cauHoiList && dm.cauHoiList.length > 0 ? (
                                        dm.cauHoiList.map(ch => (
                                            <li key={ch.maCauHoi} className="question-item">
                                                <div className="question-text">
                                                    <strong>Q: {ch.cauHoi}</strong>
                                                    <p>A: {ch.traLoi}</p>
                                                    {/* Hiển thị icon cảnh báo nếu câu hỏi có đính kèm */}
                                                    {(ch.linkLienQuan || ch.anhLienQuan) && (
                                                        <span style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px', display: 'inline-block' }}>
                                                            <i className='bx bx-paperclip'></i> Có đính kèm liên kết/ảnh
                                                        </span>
                                                    )}
                                                </div>
                                                <button className="btn-delete" onClick={() => handleXoaCauHoi(ch.maCauHoi)}>
                                                    <i className="bx bx-trash"></i>
                                                </button>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="question-empty">Chưa có câu hỏi nào.</li>
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HoTro;