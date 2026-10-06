import React, { useState, useEffect } from "react";
import "./khuyenmai_admin.css";
import axios from "axios";

function KhuyenMai() {
    // Điều khiển tab: "khuyen-mai" hoặc "flash-sale"
    const [tabDangChon, setTabDangChon] = useState("khuyen-mai");

    // ================= STATE QUẢN LÝ ẨN/HIỆN MODAL =================
    const [hienThiModalKM, setHienThiModalKM] = useState(false);
    const [hienThiModalKhungGio, setHienThiModalKhungGio] = useState(false);
    const [hienThiModalThemSP, setHienThiModalThemSP] = useState(false); // Bổ sung modal thêm SP

    // ============== LẤY DỮ LIỆU TỪ BACKEND ===========
    const [danhSachKhuyenMai, setdanhSachKhuyenMai] = useState([]);
    const [danhSachFlashSale, setdanhSachFlashSale] = useState([]);
    const [danhSachSanPhamGoc, setDanhSachSanPhamGoc] = useState([]); // Danh sách SP để chọn thả vào Flash Sale

    const taiDuLieu = () => {
        // Lấy Khuyến mãi
        axios.get("http://localhost:8080/api/khuyenmai")
            .then((res) => setdanhSachKhuyenMai(res.data))
            .catch((error) => console.error("Lỗi lấy khuyến mãi:", error));
            
        // Lấy Flash Sale (Khung giờ + Sản phẩm bên trong)
        axios.get("http://localhost:8080/api/sanphamflashsale")
            .then((res) => setdanhSachFlashSale(res.data))
            .catch((error) => console.error("Lỗi lấy flash sale:", error));

        // Lấy toàn bộ sản phẩm để đổ vào Select dropdown
        axios.get("http://localhost:8080/api/sanpham")
            .then((res) => setDanhSachSanPhamGoc(res.data))
            .catch((error) => console.error("Lỗi lấy sản phẩm gốc:", error));
    };

    useEffect(() => {
        taiDuLieu();
    }, []);

    // ================= STATE DÀNH CHO FORM NHẬP LIỆU =================
    const [formKhuyenMai, setFormKhuyenMai] = useState({
        tenKM: "", phanTram: "", dieuKien: "", ngayBD: "", ngayKT: ""
    });

    const [formKhungGio, setFormKhungGio] = useState({
        ngayApDung: "", gioBD: "", gioKT: ""
    });

    // Form thêm SP vào Flash Sale
    const [khungGioDangChon, setKhungGioDangChon] = useState(null); // Lưu mã Khung Giờ đang thao tác
    const [formSanPhamFS, setFormSanPhamFS] = useState({
        maSP: "", giaFlashSale: "", soLuongGioiHan: ""
    });

    // ================= HÀM XỬ LÝ LƯU KHUYẾN MÃI =================
    const xuLyLuuKhuyenMai = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:8080/api/admin/khuyenmai/them", formKhuyenMai);
            alert("Tạo chương trình khuyến mãi thành công!");
            setHienThiModalKM(false);
            taiDuLieu();
        } catch (error) {
            console.error("Lỗi thêm khuyến mãi:", error);
            alert("Lỗi khi tạo khuyến mãi!");
        }
    };

    // ================= HÀM XỬ LÝ LƯU KHUNG GIỜ FLASH SALE =================
    const xuLyLuuKhungGio = async (e) => {
        e.preventDefault();

        if (formKhungGio.gioKT <= formKhungGio.gioBD) {
            alert("Vui lòng nhập Giờ kết thúc phải lớn hơn Giờ bắt đầu!");
            return; 
        }

        try {
            await axios.post("http://localhost:8080/api/admin/flashsale/taokhunggio", formKhungGio);
            alert("Tạo khung giờ Flash Sale thành công!");
            setHienThiModalKhungGio(false);
            taiDuLieu();
        } catch (error) {
            const thongBaoLoi = error.response?.data?.message || "Lỗi khi tạo khung giờ Flash Sale!";
            alert(thongBaoLoi);
        }
    };

    // ================= HÀM XỬ LÝ THÊM SẢN PHẨM VÀO FLASH SALE =================
    const moModalThemSP = (maKhungGio) => {
        setKhungGioDangChon(maKhungGio);
        setFormSanPhamFS({ maSP: "", giaFlashSale: "", soLuongGioiHan: "" });
        setHienThiModalThemSP(true);
    };

    const xuLyLuuSanPhamFS = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:8080/api/admin/flashsale/themsanpham", {
                maFS: khungGioDangChon, // Gửi biến maFS (tương ứng maKhungGio)
                ...formSanPhamFS
            });
            alert("Đã thêm sản phẩm vào sự kiện Flash Sale!");
            setHienThiModalThemSP(false);
            taiDuLieu();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi thêm sản phẩm vào Flash Sale!");
        }
    };

    // ================= GOM NHÓM FLASH SALE THEO KHUNG GIỜ =================
    const nhomFlashSaleTheoKhungGio = () => {
        const nhom = {};
        danhSachFlashSale.forEach((sp) => {
            const key = sp.maKhungGio;
            if (!key) return;

            if (!nhom[key]) {
                nhom[key] = {
                    maKhungGio: sp.maKhungGio,
                    gioBD: sp.gioBD,
                    gioKT: sp.gioKT,
                    ngay: sp.ngayApDung,
                    trangThai: sp.trangThaiKhungGio,
                    danhSachSanPham: [],
                };
            }
            // Chỉ đưa sản phẩm vào mảng nếu khung giờ đó thực sự có sản phẩm
            if (sp.maSP) {
                nhom[key].danhSachSanPham.push(sp);
            }
        });
        return Object.values(nhom);
    };

    const danhSachKhungGio = nhomFlashSaleTheoKhungGio();

    // Tính % hoàn thành
    const tinhPhanTramHoanThanh = (daBan, gioiHan) => {
        const gh = Number(gioiHan) || 0;
        if (gh === 0) return 0;
        const phanTram = (Number(daBan) / gh) * 100;
        return Math.min(100, Math.max(0, phanTram));
    };

    return (
        <div className="km-container">
            <div className="km-header">
                <span className="km-title">Khuyến mãi & Flash Sale</span>
                <label className="km-subtitle">Thiết lập chiến dịch chiết khấu, voucher và các sự kiện Flash Sale bán lẻ theo giờ</label>
            </div>

            {/* TAB SWITCHER */}
            <div className="km-tabs">
                <button
                    className={`km-tab ${tabDangChon === "khuyen-mai" ? "active" : ""}`}
                    onClick={() => setTabDangChon("khuyen-mai")}
                >
                    Chương trình khuyến mãi
                </button>
                <button
                    className={`km-tab ${tabDangChon === "flash-sale" ? "active" : ""}`}
                    onClick={() => setTabDangChon("flash-sale")}
                >
                    Flash Sale theo giờ
                </button>
            </div>

            {/* ===================== TAB "CHƯƠNG TRÌNH KHUYẾN MÃI" ===================== */}
            {tabDangChon === "khuyen-mai" && (
                <div className="km-tab-content">
                    <div className="km-toolbar">
                        <div className="km-search">
                            <i className="bx bx-search"></i>
                            <input type="search" placeholder="Tìm tên flashsale..." />
                        </div>
                        <button className="btn-add-km" onClick={() => setHienThiModalKM(true)}>
                            + Tạo khuyến mãi mới
                        </button>
                    </div>

                    <table className="km-table">
                        <thead>
                            <tr>
                                <th>Tên chương trình</th>
                                <th>Điều kiện áp dụng</th>
                                <th>Mức giảm</th>
                                <th>Thời gian áp dụng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {danhSachKhuyenMai.map((km, i) =>
                                <tr key={i}>
                                    <td className="km-ten-ct">{km.tenKM}</td>
                                    <td>{km.dieuKien}</td>
                                    <td className="km-muc-giam">{km.phanTram}%</td>
                                    <td>
                                        {km.ngayBD ? new Date(km.ngayBD).toLocaleDateString('vi-VN') : ""} 
                                        {" - "} 
                                        {km.ngayKT ? new Date(km.ngayKT).toLocaleDateString('vi-VN') : ""}
                                    </td>
                                    <td>
                                        <span className={`badge ${km.trangThai ? "badge-green" : "badge-gray"}`}>
                                            {km.trangThai ? "Đang chạy" : "Tạm ngưng"}
                                        </span>
                                    </td>
                                    <td className="km-actions">
                                        <button className="btn-edit-km"><i className="bx bx-pencil"></i></button>
                                        <button className="btn-delete-km"><i className="bx bx-trash" /></button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===================== TAB "FLASH SALE THEO GIỜ" ===================== */}
            {tabDangChon === "flash-sale" && (
                <div className="km-tab-content">
                    <div className="km-section-header">
                        <button className="btn-add-khung-gio" onClick={() => setHienThiModalKhungGio(true)}>
                            + Tạo khung giờ mới
                        </button>
                    </div>

                    {danhSachKhungGio.map((khungGio, i) =>
                        <div className="km-flashsale-card" key={i}>
                            <div className="km-flashsale-card-header">
                                <div className="km-flashsale-gio">
                                    {/* Cắt chuỗi để hiển thị HH:MM thay vì HH:MM:SS */}
                                    <span className="km-flashsale-khung">
                                        {khungGio.gioBD?.substring(0, 5)} - {khungGio.gioKT?.substring(0, 5)}
                                    </span>
                                    <span className="km-flashsale-ngay">
                                        {khungGio.ngay ? new Date(khungGio.ngay).toLocaleDateString('vi-VN') : ""}
                                    </span>
                                </div>
                                <span className="badge badge-green">{khungGio.trangThai || "Sắp diễn ra"}</span>
                            </div>

                            <table className="km-flashsale-table">
                                <thead>
                                    <tr>
                                        <th>Ảnh</th>
                                        <th>Sản phẩm</th>
                                        <th>Giá niêm yết</th>
                                        <th>Giá Flash Sale</th>
                                        <th>Độ hoàn thành</th>
                                        <th>Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {khungGio.danhSachSanPham.length > 0 ? (
                                        khungGio.danhSachSanPham.map((sp, k) =>
                                            <tr key={k}>
                                                <td><img className="km-product-img" src={sp.hinhAnh || "https://placehold.co/40"} alt={sp.tenSP} /></td>
                                                <td className="km-ten-sp">{sp.tenSP}</td>
                                                <td className="km-gia-niem-yet">đ{Number(sp.giaBan || 0).toLocaleString("vi-VN")}</td>
                                                <td className="km-gia-flashsale">đ{Number(sp.giaFlashSale || 0).toLocaleString("vi-VN")}</td>
                                                <td>
                                                    <div className="km-progress-wrap">
                                                        <div className="km-progress-main">
                                                            <span className="km-da-ban">Đã bán: {sp.daBan || 0}</span>
                                                            <div className="km-progress-track">
                                                                <div className="km-progress-fill" style={{ width: `${tinhPhanTramHoanThanh(sp.daBan, sp.soLuongGioiHan)}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <span className="km-gioi-han">G.Hạn: {sp.soLuongGioiHan}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="btn-delete-km"><i className="bx bx-trash" /></button>
                                                </td>
                                            </tr>
                                        )
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>Chưa có sản phẩm nào trong khung giờ này</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Nút thêm SP truyền mã khung giờ */}
                            <button className="btn-them-sp-khung-gio" onClick={() => moModalThemSP(khungGio.maKhungGio)}>
                                + Thêm sản phẩm vào khung giờ này
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ===================== MODAL: TẠO KHUYẾN MÃI MỚI ===================== */}
            {hienThiModalKM && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <form onSubmit={xuLyLuuKhuyenMai}>
                            <div className="modal-header">
                                <h2>Tạo Khuyến Mãi Mới</h2>
                                <button type="button" className="btn-close" onClick={() => setHienThiModalKM(false)}>✖</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Tên chương trình *:</label>
                                    <input type="text" placeholder="Nhập tên chương trình..." required
                                        value={formKhuyenMai.tenKM}
                                        onChange={e => setFormKhuyenMai({ ...formKhuyenMai, tenKM: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Mức giảm (%) *:</label>
                                        <input type="number" placeholder="Ví dụ: 10" required min="1" max="100"
                                            value={formKhuyenMai.phanTram}
                                            onChange={e => setFormKhuyenMai({ ...formKhuyenMai, phanTram: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Điều kiện (VND) *:</label>
                                        <input type="number" placeholder="Đơn tối thiểu..." required min="0"
                                            value={formKhuyenMai.dieuKien}
                                            onChange={e => setFormKhuyenMai({ ...formKhuyenMai, dieuKien: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Ngày bắt đầu *:</label>
                                        <input type="date" required
                                            value={formKhuyenMai.ngayBD}
                                            onChange={e => setFormKhuyenMai({ ...formKhuyenMai, ngayBD: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày kết thúc *:</label>
                                        <input type="date" required
                                            value={formKhuyenMai.ngayKT}
                                            onChange={e => setFormKhuyenMai({ ...formKhuyenMai, ngayKT: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setHienThiModalKM(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===================== MODAL: TẠO KHUNG GIỜ FLASH SALE ===================== */}
            {hienThiModalKhungGio && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <form onSubmit={xuLyLuuKhungGio}>
                            <div className="modal-header">
                                <h2>Tạo Khung Giờ Flash Sale</h2>
                                <button type="button" className="btn-close" onClick={() => setHienThiModalKhungGio(false)}>✖</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Ngày áp dụng *:</label>
                                    <input type="date" required
                                        value={formKhungGio.ngayApDung}
                                        onChange={e => setFormKhungGio({ ...formKhungGio, ngayApDung: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Giờ bắt đầu *:</label>
                                        <input type="time" required
                                            value={formKhungGio.gioBD}
                                            onChange={e => setFormKhungGio({ ...formKhungGio, gioBD: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giờ kết thúc *:</label>
                                        <input type="time" required
                                            value={formKhungGio.gioKT}
                                            onChange={e => setFormKhungGio({ ...formKhungGio, gioKT: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setHienThiModalKhungGio(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===================== MODAL: THÊM SP VÀO FLASH SALE ===================== */}
            {hienThiModalThemSP && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <form onSubmit={xuLyLuuSanPhamFS}>
                            <div className="modal-header">
                                <h2>Thêm SP vào Flash Sale</h2>
                                <button type="button" className="btn-close" onClick={() => setHienThiModalThemSP(false)}>✖</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Chọn sản phẩm:</label>
                                    <select required
                                        value={formSanPhamFS.maSP} 
                                        onChange={e => setFormSanPhamFS({ ...formSanPhamFS, maSP: e.target.value })} 
                                    >
                                        <option value="">-- Chọn một sản phẩm --</option>
                                        {danhSachSanPhamGoc.map(sp => (
                                            <option key={sp.maSP} value={sp.maSP}>
                                                {sp.tenSP} - đ{Number(sp.giaBan || 0).toLocaleString('vi-VN')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>Giá Flash Sale (VNĐ):</label>
                                        <input type="number" min="0" required
                                            value={formSanPhamFS.giaFlashSale} 
                                            onChange={e => setFormSanPhamFS({ ...formSanPhamFS, giaFlashSale: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giới hạn số lượng bán:</label>
                                        <input type="number" min="1" required
                                            value={formSanPhamFS.soLuongGioiHan} 
                                            onChange={e => setFormSanPhamFS({ ...formSanPhamFS, soLuongGioiHan: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setHienThiModalThemSP(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Xác nhận thêm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KhuyenMai;