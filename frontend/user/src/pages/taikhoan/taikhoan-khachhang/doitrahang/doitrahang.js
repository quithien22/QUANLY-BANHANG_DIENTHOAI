import React, { useState, useEffect } from "react";
import "./doitrahang.css";
import { Link } from "react-router-dom";
import { returnApi } from "../../../../API/ReturnApi";

function DoiTraHang() {
    // ================= STATE QUẢN LÝ FORM TẠO MỚI =================
    const [maHoaDon, setMaHoaDon] = useState("");
    const [lyDo, setLyDo] = useState("");
    const [phuongThucHoan, setPhuongThucHoan] = useState("");

    // Xử lý file ảnh
    const [fileAnh, setFileAnh] = useState(null);
    const [anhPreview, setAnhPreview] = useState(null);

    // State quản lý Toast thông báo góc phải
    const [thongBaoDoiTra, setThongBaoDoiTra] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoDoiTra(noiDung);
        setTimeout(() => {
            setThongBaoDoiTra(null);
        }, 3000);
    };

    // ================= STATE QUẢN LÝ LỊCH SỬ =================
    const [lichSuDoiTra, setLichSuDoiTra] = useState([]);

    // ================= TẢI DỮ LIỆU LỊCH SỬ KHI MỞ TRANG =================
    const taiLichSu = () => {
        const userInfoStr = localStorage.getItem("userData");

        if (userInfoStr) {
            const user = JSON.parse(userInfoStr);
            const maKhachHang = user.maKH || user.id;

            returnApi.list(maKhachHang)
                .then(data => setLichSuDoiTra(data))
                .catch(err => console.error("Lỗi tải lịch sử:", err));
        } else {
            console.log("Chưa đăng nhập, không thể tải lịch sử!");
        }
    };
    useEffect(() => {
        taiLichSu();
    }, []);

    // ================= XỬ LÝ CHỌN ẢNH =================
    const handleChonAnh = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileAnh(file);
            setAnhPreview(URL.createObjectURL(file));
        }
    };

    // ================= XỬ LÝ SUBMIT FORM =================
    const handleGuiYeuCau = async (e) => {
        e.preventDefault();

        if (!maHoaDon || !lyDo) {
            alert("Vui lòng nhập mã đơn hàng và chọn lý do đổi trả!");
            return;
        }

        const lyDoChiTiet = `${lyDo} ${phuongThucHoan ? `- Hoàn tiền qua: ${phuongThucHoan}` : ""}`;
        const formData = new FormData();
        formData.append("maHoaDon", maHoaDon);
        formData.append("lyDo", lyDoChiTiet);
        formData.append("loaiYeuCau", phuongThucHoan ? "tra_hang" : "doi_hang");
        if (fileAnh) {
            formData.append("hinhAnh", fileAnh);
        }

        try {
            const data = await returnApi.create(formData);

            if (data.success) {
                hienThiThongBao("Đã gửi yêu cầu đổi trả thành công!");
                setMaHoaDon(""); setLyDo(""); setPhuongThucHoan("");
                setFileAnh(null); setAnhPreview(null);

                // Tự động load lại danh sách lịch sử bên phải sau khi gửi thành công
                taiLichSu();
            }
        } catch (error) {
            console.error("Lỗi khi gửi yêu cầu:", error);
            const thongBaoLoi = error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!";
            alert(thongBaoLoi);
        }
    };

    // Hàm chuyển đổi trạng thái tiếng Anh từ DB sang tiếng Việt và cấp độ Timeline
    const dichTrangThai = (trangThai) => {
        switch (trangThai) {
            case 'cho_duyet': return { text: 'Chờ duyệt', css: 'doitra-status-pending', step: 1 };
            case 'da_duyet': return { text: 'Đang xử lý', css: 'doitra-status-processing', step: 2 };
            case 'dang_kiem_tra': return { text: 'Kiểm tra kỹ thuật', css: 'doitra-status-testing', step: 3 };
            case 'hoan_tat': return { text: 'Hoàn tất', css: 'doitra-status-success', step: 4 };
            case 'tu_choi': return { text: 'Từ chối', css: 'doitra-status-rejected', step: 0 };
            default: return { text: 'Chờ duyệt', css: 'doitra-status-pending', step: 1 };
        }
    };

    return (
        <div className="doitra-container">

               {thongBaoDoiTra && (
                <div className="thong-bao">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoDoiTra}</span>
                </div>
            )}

            <div className="doitra-breadcrumb">
                <Link to="/home" className="doitra-breadcrumb-link">Trang chủ</Link>
                <i className="bx bx-chevron-right doitra-breadcrumb-icon"></i>
                <Link to="/tai-khoan" className="doitra-breadcrumb-link">Tài khoản</Link>
                <i className="bx bx-chevron-right doitra-breadcrumb-icon"></i>
                <span className="doitra-breadcrumb-current">Yêu cầu đổi trả & Bảo hành</span>
            </div>

            <ul className="doitra-main-layout">
                {/* CỘT TRÁI: FORM TẠO YÊU CẦU */}
                <li className="doitra-form-section">
                    <span className="doitra-section-title">Tạo yêu cầu đổi trả mới</span>
                    <form onSubmit={handleGuiYeuCau} className="doitra-form-steps-list" style={{ padding: 0, margin: 0, listStyle: 'none' }}>

                        <li className="doitra-form-step">
                            <label className="doitra-form-label">1. Chọn đơn hàng cần đổi trả:</label>
                            <div className="doitra-form-input-wrapper">
                                <input
                                    type="text"
                                    className="doitra-form-input"
                                    placeholder="Ví dụ: HD-001..."
                                    value={maHoaDon}
                                    onChange={(e) => setMaHoaDon(e.target.value)}
                                />
                            </div>
                        </li>

                        <li className="doitra-form-step">
                            <label className="doitra-form-label">2. Lý do đổi trả:</label>
                            {[
                                "Lỗi kỹ thuật do nhà sản xuất (Màn hình sọc, không lên nguồn).",
                                "Sản phẩm bị bể vỡ, móp méo trong quá trình vận chuyển.",
                                "Giao sai sản phẩm, sai màu sắc hoặc dung lượng đặt hàng.",
                                "Khác (Vui lòng liên hệ trực tiếp tổng đài)."
                            ].map((item, index) => (
                                <label className="doitra-form-radio-group" key={index}>
                                    <input
                                        type="radio"
                                        name="lyDo"
                                        className="doitra-form-radio"
                                        value={item}
                                        checked={lyDo === item}
                                        onChange={(e) => setLyDo(e.target.value)}
                                    />
                                    <span className="doitra-form-radio-text">{item}</span>
                                </label>
                            ))}
                        </li>

                        <li className="doitra-form-step">
                            <label className="doitra-form-label">3. Hình ảnh / Video bằng chứng lỗi (Bắt buộc):</label>
                            <label className="doitra-form-upload-btn" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleChonAnh}
                                />
                                <i className="bx bx-cloud-upload doitra-form-upload-icon"></i>
                                {fileAnh ? fileAnh.name : "Nhấn để tải lên hình ảnh chụp lỗi của sản phẩm"}
                                <span className="doitra-form-upload-note">Yêu cầu chụp rõ nét tem bảo hành và chi tiết lỗi sản phẩm</span>
                            </label>

                            {anhPreview && (
                                <img src={anhPreview} alt="Preview" style={{ marginTop: "10px", maxHeight: "150px", borderRadius: "8px", objectFit: "cover" }} />
                            )}
                        </li>

                        <li className="doitra-form-step">
                            <span className="doitra-form-label">4. Phương thức hoàn tiền mong muốn:</span>
                            <div className="doitra-form-step-pt">
                                <label className="doitra-form-radio-group">
                                    <input
                                        type="radio"
                                        name="refundMethod"
                                        className="doitra-form-radio"
                                        value="MoMo/ZaloPay"
                                        checked={phuongThucHoan === "MoMo/ZaloPay"}
                                        onChange={(e) => setPhuongThucHoan(e.target.value)}
                                    />
                                    <span className="doitra-form-radio-text">Ví điện tử MoMo / ZaloPay</span>
                                </label>
                                <label className="doitra-form-radio-group">
                                    <input
                                        type="radio"
                                        name="refundMethod"
                                        className="doitra-form-radio"
                                        value="Chuyển khoản"
                                        checked={phuongThucHoan === "Chuyển khoản"}
                                        onChange={(e) => setPhuongThucHoan(e.target.value)}
                                    />
                                    <span className="doitra-form-radio-text">Chuyển khoản Ngân hàng</span>
                                </label>
                            </div>
                        </li>

                        <button type="submit" className="doitra-form-submit-btn">GỬI YÊU CẦU ĐỔI TRẢ</button>
                    </form>
                </li>

                {/* CỘT PHẢI: LỊCH SỬ ĐỔI TRẢ & TIẾN TRÌNH */}
                <li className="doitra-history-section">
                    <span className="doitra-section-title">Lịch sử đổi trả gần đây</span>

                    {lichSuDoiTra.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                            Bạn chưa có yêu cầu đổi trả nào.
                        </div>
                    ) : (
                        lichSuDoiTra.map((item, index) => {
                            const thongTinTrangThai = dichTrangThai(item.trangThai);
                            const currentStep = thongTinTrangThai.step;

                            return (
                                <div className="doitra-history-card" key={item.maDoiTra || index} style={{ marginBottom: "20px" }}>
                                    <div className="doitra-history-card-boder">
                                        <div className="doitra-history-card-header">
                                            <span className="doitra-history-order-id">Yêu cầu #{item.maDoiTra}</span>
                                            <span className={`doitra-history-status ${thongTinTrangThai.css}`}>
                                                {thongTinTrangThai.text}
                                            </span>
                                        </div>
                                        <span className="doitra-history-product-name">
                                            Sản phẩm: {item.tenSP || "Sản phẩm đổi trả"}
                                        </span>
                                        <div className="doitra-history-product-phanhoi">Phản hồi: {item.ghiChuNoiBo}</div>
                                        {item.ghiChuNoiBo && item.trangThai === 'tu_choi' && (
                                            <div style={{ color: 'red', fontSize: '13px', marginTop: '5px' }}>
                                                Lý do từ chối: {item.ghiChuNoiBo}
                                            </div>
                                        )}
                                    </div>

                                    <div className="doitra-history-timeline-container">
                                        <ul className="doitra-timeline-list">
                                            <li className={`doitra-timeline-item ${currentStep >= 1 ? 'doitra-active' : ''}`}>
                                                <i className="bx bxs-circle doitra-timeline-icon"></i>
                                                <div className="doitra-timeline-content">
                                                    <span className="doitra-timeline-title">Đã tiếp nhận yêu cầu</span>
                                                    <span className="doitra-timeline-desc">Nhân viên CSKH đang duyệt hồ sơ chứng cứ lỗi.</span>
                                                </div>
                                            </li>
                                            <li className={`doitra-timeline-item ${currentStep >= 2 ? 'doitra-active' : ''}`}>
                                                <i className="bx bxs-circle doitra-timeline-icon"></i>
                                                <div className="doitra-timeline-content">
                                                    <span className="doitra-timeline-title">Thu hồi / Xử lý</span>
                                                    <span className="doitra-timeline-desc">Tiến hành thu hồi máy lỗi hoặc xem xét yêu cầu.</span>
                                                </div>
                                            </li>
                                            <li className={`doitra-timeline-item ${currentStep >= 3 ? 'doitra-active' : ''}`}>
                                                <i className="bx bxs-circle doitra-timeline-icon"></i>
                                                <div className="doitra-timeline-content">
                                                    <span className="doitra-timeline-title">Kiểm tra kỹ thuật</span>
                                                    <span className="doitra-timeline-desc">Đội ngũ kỹ sư kiểm tra trực quan sản phẩm lỗi.</span>
                                                </div>
                                            </li>
                                            <li className={`doitra-timeline-item ${currentStep >= 4 ? 'doitra-active' : ''}`}>
                                                <i className="bx bxs-circle doitra-timeline-icon"></i>
                                                <div className="doitra-timeline-content">
                                                    <span className="doitra-timeline-title">Hoàn tất xử lý</span>
                                                    <span className="doitra-timeline-desc">Phê duyệt đổi máy mới hoặc hoàn trả tiền.</span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </li>
            </ul>
        </div>
    );
}

export default DoiTraHang;