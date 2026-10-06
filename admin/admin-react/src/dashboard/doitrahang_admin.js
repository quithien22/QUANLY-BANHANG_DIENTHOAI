import React, { useState, useEffect } from "react";
import "./doitrahang_admin.css";
import axios from "axios";
import Swal from "sweetalert2";

function DoiTraHang() {

    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "null");
    const maNV = adminInfo?.maNV;

    // ============== DANH SÁCH YÊU CẦU ĐỔI TRẢ ===========
    const [danhSach, setDanhSach] = useState([]);

    const taiDanhSach = () => {
        axios.get("http://localhost:8080/api/doitrahang")
            .then((response) => setDanhSach(response.data))
            .catch((error) => console.error("Lỗi khi lấy danh sách đổi trả:", error));
    };

    useEffect(() => {
        taiDanhSach();
    }, []);

    // ============== TAB TRẠNG THÁI ===========
    const [tabDangChon, setTabDangChon] = useState("cho_duyet");

    const cacTab = [
        { giaTri: "cho_duyet", nhan: "Chờ duyệt" },
        { giaTri: "da_duyet", nhan: "Đã duyệt" },
        { giaTri: "tu_choi", nhan: "Từ chối" },
        { giaTri: "hoan_tat", nhan: "Hoàn tất" },
    ];

    const demSoLuong = (giaTri) => danhSach.filter((yc) => yc.trangThai === giaTri).length;

    const danhSachDaLoc = danhSach.filter((yc) => yc.trangThai === tabDangChon);

    // ============== HIỂN THỊ TRẠNG THÁI / LOẠI YÊU CẦU ===========
    const nhanTrangThai = (giaTri) => {
        const tim = cacTab.find((t) => t.giaTri === giaTri);
        return tim ? tim.nhan : giaTri;
    };

    const nhanLoaiYeuCau = (loai) => (loai === "doi_hang" ? "Đổi hàng" : "Trả hàng");

    const dinhDangNgay = (ngay) => (ngay ? new Date(ngay).toLocaleDateString("vi-VN") : "");
 
    // ================== MODAL CHI TIẾT / XỬ LÝ ====================
    const [hienModal, setHienModal] = useState(false);
    const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
    const [chiTiet, setChiTiet] = useState(null);

    const [hinhThucGiaiQuyet, setHinhThucGiaiQuyet] = useState("hoan_tien");
    const [ghiChuNoiBo, setGhiChuNoiBo] = useState("");

    const moModalChiTiet = (yc) => {
        setHienModal(true);
        setDangTaiChiTiet(true);
        setChiTiet(null);
        setGhiChuNoiBo("");
        setHinhThucGiaiQuyet("hoan_tien");

        axios.get(`http://localhost:8080/api/doitrahang/${yc.maDoiTra}/chitiet`)
            .then((response) => {
                setChiTiet(response.data);
                setGhiChuNoiBo(response.data.ghiChuNoiBo || "");
                setHinhThucGiaiQuyet(response.data.hinhThucGiaiQuyet || "hoan_tien");
            })
            .catch((error) => console.error("Lỗi khi lấy chi tiết đổi trả:", error))
            .finally(() => setDangTaiChiTiet(false));
    };

    const dongModal = () => {
        setHienModal(false);
        setChiTiet(null);
    };

    const xuLyYeuCau = (trangThaiMoi) => {
        if (!chiTiet) return;

        axios.put(`http://localhost:8080/api/doitrahang/xuly/${chiTiet.maDoiTra}`, {
            trangThai: trangThaiMoi,
            hinhThucGiaiQuyet,
            ghiChuNoiBo,
            maNV,
        })
            .then(() => {
                Swal.fire("Đã cập nhật!", "", "success");
                taiDanhSach();
                dongModal();
            })
            .catch((error) => {
                console.error("Lỗi khi xử lý yêu cầu:", error);
                Swal.fire("Lỗi!", "Không thể cập nhật yêu cầu", "error");
            });
    };

    const duyetYeuCau = () => {
        Swal.fire({
            title: "Duyệt yêu cầu đổi trả này?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Duyệt",
            cancelButtonText: "Hủy",
        }).then((kq) => { if (kq.isConfirmed) xuLyYeuCau("da_duyet"); });
    };

    const tuChoiYeuCau = () => {
        if (!ghiChuNoiBo.trim()) {
            Swal.fire("Thiếu thông tin!", "Vui lòng nhập lý do từ chối vào ô ghi chú nội bộ.", "warning");
            return;
        }
        Swal.fire({
            title: "Từ chối yêu cầu đổi trả này?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Từ chối",
            confirmButtonColor: "#DC2626",
            cancelButtonText: "Hủy",
        }).then((kq) => { if (kq.isConfirmed) xuLyYeuCau("tu_choi"); });
    };

    const hoanTatYeuCau = () => {
        Swal.fire({
            title: "Đánh dấu yêu cầu này đã hoàn tất?",
            text: "Xác nhận đã hoàn tiền / đổi hàng xong cho khách.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Hoàn tất",
            cancelButtonText: "Hủy",
        }).then((kq) => { if (kq.isConfirmed) xuLyYeuCau("hoan_tat"); });
    };


    // ==================== PHAN TRANG ===============
        const soLuongTrangDoiTra = 10;
        const [trangThaiDoiTra, setTrangThaiDoiTra] = useState(1);
        const tinhSoDonHangMotTrang = Math.ceil(danhSachDaLoc.length / soLuongTrangDoiTra);
        const viTriBatDauTrang = (trangThaiDoiTra - 1) * soLuongTrangDoiTra;
    
        const danhSachDoiTraHang = danhSachDaLoc.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongTrangDoiTra);
        const danhSachTrangDonHang = Array.from({ length: tinhSoDonHangMotTrang }, (_, i) => i + 1);
    
        

    return (
        <div className="dtr-container">
            <div className="dtr-header">
                <span className="dtr-title">Yêu cầu đổi trả</span>
                <label className="dtr-subtitle">Kiểm soát và xử lý các khiếu nại, hỗ trợ chính sách đổi trả minh bạch cho khách hàng</label>
            </div>

            {/* TABS TRẠNG THÁI */}
            <div className="dtr-tabs">
                {cacTab.map((tab) => (
                    <button
                        key={tab.giaTri}
                        className={`dtr-tab-btn ${tabDangChon === tab.giaTri ? "active" : ""}`}
                        onClick={() => setTabDangChon(tab.giaTri)}
                    >
                        {tab.nhan} ({demSoLuong(tab.giaTri)})
                    </button>
                ))}
            </div>

            {/* BẢNG YÊU CẦU */}
            <table className="dtr-table">
                <thead>
                    <tr>
                        <th>Mã yêu cầu</th>
                        <th>Mã đơn gốc</th>
                        <th>Sản phẩm cần đổi trả</th>
                        <th>Loại yêu cầu</th>
                        <th>Lý do hoàn trả</th>
                        <th>Ngày gửi</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {danhSachDoiTraHang.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="dtr-trong">Không có yêu cầu nào ở trạng thái này.</td>
                        </tr>
                    ) : (
                        danhSachDoiTraHang.map((yc, i) => (
                            <tr key={yc.maDoiTra ?? i}>
                                <td className="dtr-ma">{yc.maDoiTra}</td>
                                <td>{yc.maHoaDon}</td>
                                <td>{yc.tenSP}</td>
                                <td>{nhanLoaiYeuCau(yc.loaiYeuCau)}</td>
                                <td className="dtr-lydo">{yc.lyDo}</td>
                                <td>{dinhDangNgay(yc.ngayTao)}</td>
                                <td>
                                    <span className={`dtr-trangthai trangthai-${yc.trangThai}`}>
                                        {nhanTrangThai(yc.trangThai)}
                                    </span>
                                </td>
                                <td>
                                    <button className="dtr-btn-chitiet" onClick={() => moModalChiTiet(yc)}>
                                        Chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

             {/* FOOTER PHÂN TRANG */}
            <div className="dtr-page-pagination">
                <span>
                    Hiển thị {danhSachDaLoc.length === 0 ? 0 : viTriBatDauTrang + 1} - {Math.min(viTriBatDauTrang + soLuongTrangDoiTra, danhSachDaLoc.length)} trên tổng số {danhSachDaLoc.length} đơn hàng đổi trả.
                </span>

                <div className="dtr-pagesp-pagination">
                    <button
                        className="dtr-page-page_btn"
                        onClick={() => setTrangThaiDoiTra(trangThaiDoiTra - 1)}
                        disabled={trangThaiDoiTra === 1}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>

                    {danhSachTrangDonHang.map((soTrang) => (
                        <button
                            key={soTrang}
                            className={`dtr-page-page_btn ${trangThaiDoiTra === soTrang ? "active" : ""}`}
                            onClick={() => setTrangThaiDoiTra(soTrang)}
                        >
                            {soTrang}
                        </button>
                    ))}

                    <button
                        className="dtr-page-page_btn"
                        onClick={() => setTrangThaiDoiTra(trangThaiDoiTra + 1)}
                        disabled={trangThaiDoiTra === tinhSoDonHangMotTrang || tinhSoDonHangMotTrang === 0}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* MODAL CHI TIẾT / XỬ LÝ */}
            {hienModal && (
                <div className="modal-overlay" onClick={dongModal}>
                    <div className="dtr-modal-box" onClick={(e) => e.stopPropagation()}>
                        {dangTaiChiTiet || !chiTiet ? (
                            <p className="dtr-trong">Đang tải chi tiết...</p>
                        ) : (
                            <>
                                <div className="dtr-modal-header">
                                    <h3>
                                        Chi tiết yêu cầu đổi trả: {chiTiet.maDoiTra}
                                        <span className={`dtr-trangthai trangthai-${chiTiet.trangThai}`}>
                                            {nhanTrangThai(chiTiet.trangThai)}
                                        </span>
                                    </h3>
                                    <button onClick={dongModal}>
                                        <i className="bx bx-x"></i>
                                    </button>
                                </div>

                                <div className="dtr-modal-grid">
                                    {/* CỘT TRÁI: THÔNG TIN ĐƠN GỐC */}
                                    <div className="dtr-modal-col">
                                        <div className="dtr-donhang-box">
                                            <div className="dtr-donhang-top">
                                                <span className="dtr-donhang-ma">Đơn hàng #{chiTiet.maHoaDon}</span>
                                                <span className="dtr-donhang-tt">
                                                    Thanh toán: {chiTiet.phuongThuc || "Chưa rõ"}
                                                </span>
                                            </div>
                                            <span className="dtr-donhang-dong">
                                                Khách hàng: {chiTiet.tenKhachHang} - {chiTiet.sdtKhachHang}
                                            </span>
                                            <span className="dtr-donhang-dong">
                                                Địa chỉ: {chiTiet.diaChiChiTiet}
                                            </span>
                                        </div>

                                        <div className="dtr-modal-section">
                                            <span className="dtr-modal-section-title">Sản phẩm yêu cầu đổi trả</span>
                                            <span className="dtr-ten-sp">{chiTiet.tenSP}</span>
                                        </div>

                                        <div className="dtr-modal-section">
                                            <span className="dtr-modal-section-title">Lý do hoàn trả chi tiết</span>
                                            <p className="dtr-lydo-chitiet">"{chiTiet.lyDo}"</p>
                                        </div>

                                        {chiTiet.hinhAnh?.length > 0 && (
                                            <div className="dtr-modal-section">
                                                <span className="dtr-modal-section-title">Ảnh minh chứng khách hàng cung cấp</span>
                                                <div className="dtr-anh-list">
                                                    {chiTiet.hinhAnh.map((anh, i) => (
                                                        <img
                                                            key={i}
                                                            src={anh?.startsWith("http") ? anh : `http://localhost:8080${anh}`}
                                                            alt=""
                                                            className="dtr-anh-item"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CỘT PHẢI: XỬ LÝ YÊU CẦU */}
                                    <div className="dtr-modal-col">
                                        <div className="dtr-xuly-box">
                                            <span className="dtr-modal-section-title">Xử lý yêu cầu</span>

                                            <div className="modal-field">
                                                <label>Hình thức giải quyết</label>
                                                <select
                                                    value={hinhThucGiaiQuyet}
                                                    onChange={(e) => setHinhThucGiaiQuyet(e.target.value)}
                                                    disabled={chiTiet.trangThai !== "cho_duyet"}
                                                >
                                                    <option value="hoan_tien">Hoàn tiền (Thẻ VNPAY)</option>
                                                    <option value="doi_san_pham_moi">Đổi sản phẩm mới</option>
                                                    <option value="sua_chua">Sửa chữa bảo hành</option>
                                                </select>
                                            </div>

                                            <div className="modal-field">
                                                <label>Ghi chú nội bộ</label>
                                                <textarea
                                                    className="dtr-textarea"
                                                    rows="4"
                                                    placeholder="Nhập lý do duyệt/từ chối hoặc thông tin chuyển khoản nội bộ..."
                                                    value={ghiChuNoiBo}
                                                    onChange={(e) => setGhiChuNoiBo(e.target.value)}
                                                    disabled={chiTiet.trangThai !== "cho_duyet"}
                                                />
                                            </div>

                                            {chiTiet.trangThai === "cho_duyet" && (
                                                <div className="dtr-xuly-actions">
                                                    <button className="dtr-btn-duyet" onClick={duyetYeuCau}>
                                                        Duyệt yêu cầu
                                                    </button>
                                                    <button className="dtr-btn-tuchoi" onClick={tuChoiYeuCau}>
                                                        Từ chối
                                                    </button>
                                                </div>
                                            )}

                                            {chiTiet.trangThai === "da_duyet" && (
                                                <div className="dtr-xuly-actions">
                                                    <button className="dtr-btn-duyet" onClick={hoanTatYeuCau}>
                                                        Đánh dấu hoàn tất
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
export default DoiTraHang;