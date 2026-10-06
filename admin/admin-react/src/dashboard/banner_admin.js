import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from 'sweetalert2';
import "./banner_admin.css";

function Banner() {
    // 1. Kiểm tra quyền (Chỉ Giám đốc CV01 và Quản lý CV02 mới được sửa)
    const adminInfo = JSON.parse(localStorage.getItem("adminData") || "{}");
    const coQuyenSua = adminInfo.maCV === 'CV01' || adminInfo.maCV === 'CV02';

    // 2. State quản lý dữ liệu
    const [danhSachBanner, setDanhSachBanner] = useState([]);
    const inputBannerRef = useRef(null);
    const [formBanner, setFormBanner] = useState({
        tenBanner: "", duongDan: "", viTri: "slider_chinh", thuTu: 1,
        tieuDe: "", moTa: "", textNutBam: "",
        fileAnh: null, hinhAnhPreview: ""
    });

    // 3. Tải danh sách Banner khi vào trang
    const taiDanhSachBanner = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/caidat/banner");
            setDanhSachBanner(res.data);
        } catch (err) {
            console.error("Lỗi tải banner:", err);
        }
    };

    useEffect(() => {
        taiDanhSachBanner();
    }, []);

    // 4. Xử lý thêm Banner mới
    const luuBannerMoi = async () => {
        if (!formBanner.tenBanner) return Swal.fire('Lỗi', 'Vui lòng nhập tên chiến dịch!', 'error');
        if (!formBanner.fileAnh) return Swal.fire('Lỗi', 'Vui lòng chọn hình ảnh!', 'error');

        const formData = new FormData();
        formData.append("tenBanner", formBanner.tenBanner);
        formData.append("duongDan", formBanner.duongDan);
        formData.append("viTri", formBanner.viTri);
        formData.append("thuTu", formBanner.thuTu);
        formData.append("tieuDe", formBanner.tieuDe);
        formData.append("moTa", formBanner.moTa);
        formData.append("textNutBam", formBanner.textNutBam);
        formData.append("hinhAnh", formBanner.fileAnh);

        try {
            await axios.post("http://localhost:8080/api/caidat/banner", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire('Thành công!', 'Đã thêm banner mới.', 'success');
            setFormBanner({
                tenBanner: "", duongDan: "", viTri: "slider_chinh", thuTu: 1,
                tieuDe: "", moTa: "", textNutBam: "",
                fileAnh: null, hinhAnhPreview: ""
            });
            inputBannerRef.current.value = ""; // Reset ô input file
            taiDanhSachBanner();
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể thêm banner', 'error');
        }
    };

    // 5. Đổi trạng thái hiển thị (Bật / Tắt)
    const doiTrangThai = async (id, trangThaiHienTai) => {
        if (!coQuyenSua) return Swal.fire('Cảnh báo', 'Bạn không có quyền sửa!', 'warning');
        try {
            await axios.put(`http://localhost:8080/api/caidat/banner/trangthai/${id}`, {
                trangThai: !trangThaiHienTai
            });
            taiDanhSachBanner();
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể đổi trạng thái', 'error');
        }
    };

    // 6. Xóa Banner
    const xoaBanner = (id) => {
        if (!coQuyenSua) return Swal.fire('Cảnh báo', 'Bạn không có quyền xóa!', 'warning');
        Swal.fire({
            title: 'Chắc chắn xóa?',
            text: "Banner này sẽ bị xóa khỏi hệ thống!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:8080/api/caidat/banner/${id}`);
                    Swal.fire('Đã xóa!', 'Banner đã được xóa thành công.', 'success');
                    taiDanhSachBanner();
                } catch (err) {
                    Swal.fire('Lỗi', 'Không thể xóa banner', 'error');
                }
            }
        });
    };

    return (
        <div className="banner-container">
            <div className="banner-header">
                <h2>Quản lý Banner & Quảng cáo</h2>
                <p>Thiết lập hình ảnh và nội dung các chiến dịch trên trang chủ</p>
            </div>

            {/* KHU VỰC THÊM BANNER (Chỉ hiện nếu có quyền) */}
            {coQuyenSua && (
                <div className="banner-form-card">
                    <h3>Thêm Banner Mới</h3>
                    
                    <div className="banner-form-grid">
                        <div className="banner-input-group">
                            <label>Tên chiến dịch (Bắt buộc)</label>
                            <input type="text" placeholder="VD: Sale iPhone 15..." value={formBanner.tenBanner} onChange={e => setFormBanner({...formBanner, tenBanner: e.target.value})} />
                        </div>
                        
                        <div className="banner-input-group">
                            <label>Vị trí hiển thị</label>
                            <select value={formBanner.viTri} onChange={e => setFormBanner({...formBanner, viTri: e.target.value})}>
                                <option value="slider_chinh">Slider Chính Trượt (Bên trái)</option>
                                <option value="phu_tren">Banner Phụ (Góc phải trên)</option>
                                <option value="phu_duoi">Banner Phụ (Góc phải dưới)</option>
                            </select>
                        </div>
                    </div>

                    {/* Chỉ hiện nhóm nhập Chữ nếu chọn Slider Chính */}
                    {formBanner.viTri === 'slider_chinh' && (
                        <div className="banner-text-box">
                            <label className="text-box-title"><i className='bx bx-text'></i> Nội dung chữ hiển thị đè lên ảnh</label>
                            <input type="text" placeholder="Tiêu đề chính (VD: iPhone 17 Pro siêu đỉnh)" value={formBanner.tieuDe} onChange={e => setFormBanner({...formBanner, tieuDe: e.target.value})} />
                            <textarea rows="2" placeholder="Mô tả ngắn (VD: Giảm thêm tới 2 triệu khi qua VNPay...)" value={formBanner.moTa} onChange={e => setFormBanner({...formBanner, moTa: e.target.value})}></textarea>
                            <div className="banner-form-grid">
                                <input type="text" placeholder="Chữ trên nút (VD: Mua ngay)" value={formBanner.textNutBam} onChange={e => setFormBanner({...formBanner, textNutBam: e.target.value})} />
                                <input type="text" placeholder="Link khi bấm nút (VD: /iphone-17)" value={formBanner.duongDan} onChange={e => setFormBanner({...formBanner, duongDan: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {/* Nếu không phải slider chính thì chỉ cần nhập link */}
                    {formBanner.viTri !== 'slider_chinh' && (
                        <div className="banner-input-group" style={{marginTop: '15px'}}>
                            <label>Link chuyển hướng khi khách click vào ảnh</label>
                            <input type="text" placeholder="VD: /danh-muc/phu-kien" value={formBanner.duongDan} onChange={e => setFormBanner({...formBanner, duongDan: e.target.value})} />
                        </div>
                    )}

                    <div className="banner-upload-row">
                        <div className="banner-file-btn" onClick={() => inputBannerRef.current.click()}>
                            <i className='bx bx-upload'></i> Chọn hình ảnh
                        </div>
                        <input type="file" ref={inputBannerRef} hidden onChange={e => {
                            const file = e.target.files[0];
                            if(file) setFormBanner({...formBanner, fileAnh: file, hinhAnhPreview: URL.createObjectURL(file)});
                        }} />
                        
                        {formBanner.hinhAnhPreview && <img src={formBanner.hinhAnhPreview} alt="Preview" className="banner-preview-img" />}
                        
                        <button className="banner-submit-btn" onClick={luuBannerMoi}>
                            <i className='bx bx-save'></i> Lưu Banner
                        </button>
                    </div>
                </div>
            )}

            {/* DANH SÁCH BANNER */}
            <div className="banner-list-card">
                <h3>Danh sách các Banner hiện có</h3>
                <table className="banner-table">
                    <thead>
                        <tr>
                            <th>Hình ảnh</th>
                            <th>Chiến dịch</th>
                            <th>Vị trí</th>
                            <th>Thứ tự</th>
                            <th>Trạng thái</th>
                            {coQuyenSua && <th>Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {danhSachBanner.map(bn => (
                            <tr key={bn.maBanner}>
                                <td>
                                    <img src={bn.hinhAnh} alt="" className={`banner-table-img ${bn.viTri === 'slider_chinh' ? 'lg' : 'sm'}`} />
                                </td>
                                <td>
                                    <strong>{bn.tenBanner}</strong>
                                    <div className="banner-link-text">{bn.duongDan}</div>
                                </td>
                                <td>
                                    <span className={`banner-badge ${bn.viTri}`}>
                                        {bn.viTri === 'slider_chinh' ? "Slider Chính" : bn.viTri === 'phu_tren' ? "Phụ Trên" : "Phụ Dưới"}
                                    </span>
                                </td>
                                <td>{bn.thuTu}</td>
                                <td>
                                    <button className={`banner-toggle ${bn.trangThai ? "on" : ""}`} onClick={() => doiTrangThai(bn.maBanner, bn.trangThai)} disabled={!coQuyenSua}>
                                        <span className="banner-toggle-knob"></span>
                                    </button>
                                </td>
                                {coQuyenSua && (
                                    <td>
                                        <button className="banner-delete-btn" onClick={() => xoaBanner(bn.maBanner)}>
                                            <i className="bx bx-trash"></i>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Banner;