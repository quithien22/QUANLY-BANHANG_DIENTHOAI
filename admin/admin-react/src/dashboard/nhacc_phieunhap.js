import React, { useState, useEffect } from "react";
import "./nhacc_phieunhap.css";
import axios from "axios";

function NhaCungCap_NhapHang() {
    // Điều khiển tab đang xem: "nha-cung-cap" hoặc "phieu-nhap"
    const [tabDangChon, setTabDangChon] = useState("nha-cung-cap");

    // Phân trang riêng cho từng tab để không bị xung đột
    const [trangNCC, setTrangNCC] = useState(1);
    const [trangPN, setTrangPN] = useState(1);
    const soLuongMotTrang = 10;

    // ================= 1. QUẢN LÝ NHÀ CUNG CẤP =================
    const [danhSachNCC, setDanhSachNCC] = useState([]);
    const [tuKhoaNCC, setTuKhoaNCC] = useState("");
    
    // Modal Thêm/Sửa NCC
    const [hienModalNCC, setHienModalNCC] = useState(false);
    const [nccDangSua, setNccDangSua] = useState(null);
    const [tenNCC, setTenNCC] = useState("");
    const [diaChiNCC, setDiaChiNCC] = useState("");
    const [sdtNCC, setSdtNCC] = useState("");
    const [trangThaiNCC, setTrangThaiNCC] = useState(0); // 0: Đang hợp tác, 1: Ngừng hợp tác

    const taiDanhSachNCC = () => {
        axios.get("http://localhost:8080/api/nhacungcap")
            .then((res) => setDanhSachNCC(res.data))
            .catch((err) => console.error("Lỗi lấy danh sách NCC:", err));
    };

    useEffect(() => {
        taiDanhSachNCC();
    }, []);

    const moModalThemNCC = () => {
        setNccDangSua(null);
        setTenNCC("");
        setDiaChiNCC("");
        setSdtNCC("");
        setTrangThaiNCC(0);
        setHienModalNCC(true);
    };

    const moModalSuaNCC = (ncc) => {
        setNccDangSua(ncc);
        setTenNCC(ncc.tenNCC);
        setDiaChiNCC(ncc.diaChi);
        setSdtNCC(ncc.SDT);
        setTrangThaiNCC(ncc.trangThai);
        setHienModalNCC(true);
    };

    const xuLyLuuNCC = async (e) => {
        e.preventDefault();
        try {
            if (nccDangSua) {
                // Sửa NCC
                await axios.put(`http://localhost:8080/api/nhacungcap/sua/${nccDangSua.maNCC}`, {
                    tenNCC, diaChi: diaChiNCC, SDT: sdtNCC, trangThai: trangThaiNCC
                });
                alert("Cập nhật nhà cung cấp thành công!");
            } else {
                // Thêm NCC
                await axios.post("http://localhost:8080/api/nhacungcap/them", {
                    tenNCC, diaChi: diaChiNCC, SDT: sdtNCC
                });
                alert("Thêm nhà cung cấp thành công!");
            }
            setHienModalNCC(false);
            taiDanhSachNCC();
        } catch (err) {
            console.error("Lỗi lưu NCC:", err);
            alert("Thao tác thất bại!");
        }
    };

    // Lọc NCC theo từ khóa tìm kiếm
    const nccDaLoc = danhSachNCC.filter(ncc => 
        ncc.tenNCC.toLowerCase().includes(tuKhoaNCC.toLowerCase()) ||
        ncc.SDT.includes(tuKhoaNCC)
    );

    // ================= 2. QUẢN LÝ PHIẾU NHẬP =================
    const [danhSachPhieuNhap, setDanhSachPhieuNhap] = useState([]);
    const [danhSachSanPham, setDanhSachSanPham] = useState([]);

    const taiDanhSachPhieuNhap = () => {
        axios.get("http://localhost:8080/api/phieunhap_nhacungcap")
            .then((res) => setDanhSachPhieuNhap(res.data))
            .catch((err) => console.error("Lỗi lấy danh sách phiếu nhập:", err));
    };

    useEffect(() => {
        taiDanhSachPhieuNhap();
        // Lấy danh sách sản phẩm cho form tạo phiếu nhập
        axios.get("http://localhost:8080/api/sanpham")
            .then((res) => setDanhSachSanPham(res.data))
            .catch((err) => console.error("Lỗi lấy sản phẩm:", err));
    }, []);

    // Tạo phiếu nhập mới
    const [hienModalPhieuNhap, setHienModalPhieuNhap] = useState(false);
    const [maNCCChon, setMaNCCChon] = useState("");
    const [sanPhamNhap, setSanPhamNhap] = useState([
        { maSP: "", soLuong: "", giaNhap: "", hanSuDung: "" }
    ]);

    const themDongSanPham = () => {
        setSanPhamNhap([...sanPhamNhap, { maSP: "", soLuong: "", giaNhap: "", hanSuDung: "" }]);
    };

    const xoaDongSanPham = (index) => {
        setSanPhamNhap(sanPhamNhap.filter((_, i) => i !== index));
    };

    const capNhatDongSanPham = (index, field, value) => {
        const banSao = [...sanPhamNhap];
        banSao[index] = { ...banSao[index], [field]: value };

        if (field === "maSP") {
            const spDuocChon = danhSachSanPham.find(sp => String(sp.maSP) === String(value));
            if (spDuocChon && !banSao[index].giaNhap) {
                banSao[index].giaNhap = spDuocChon.giaNhap || "";
            }
        }
        setSanPhamNhap(banSao);
    };

    const tinhThanhTien = (sp) => {
        return (Number(sp.soLuong) || 0) * (Number(sp.giaNhap) || 0);
    };

    const tongCongPhieuDangTao = sanPhamNhap.reduce(
        (tong, sp) => tong + tinhThanhTien(sp), 0
    );

    const luuPhieuNhap = async () => {
        if (!maNCCChon) {
            alert("Vui lòng chọn nhà cung cấp!");
            return;
        }
        if (sanPhamNhap.length === 0 || !sanPhamNhap[0].maSP) {
            alert("Vui lòng thêm ít nhất một sản phẩm nhập kho!");
            return;
        }

        try {
            // Lấy thông tin nhân viên đang đăng nhập từ localStorage nếu có
            const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
            const maNV = adminData.maNV || "NV01"; // Mặc định NV01 nếu chưa đăng nhập

            await axios.post("http://localhost:8080/api/phieunhap_nhacungcap/them", {
                maNCC: maNCCChon,
                maNV: maNV,
                danhSachSanPham: sanPhamNhap
            });

            alert("Tạo phiếu nhập thành công và đã cập nhật tồn kho!");
            setHienModalPhieuNhap(false);
            setMaNCCChon("");
            setSanPhamNhap([{ maSP: "", soLuong: "", giaNhap: "", hanSuDung: "" }]);
            taiDanhSachPhieuNhap();
        } catch (err) {
            console.error("Lỗi tạo phiếu nhập:", err);
            alert("Tạo phiếu nhập thất bại: " + (err.response?.data?.message || err.message));
        }
    };

    // ================= 3. XEM CHI TIẾT PHIẾU NHẬP =================
    const [hienModalChiTiet, setHienModalChiTiet] = useState(false);
    const [phieuDangXemChiTiet, setPhieuDangXemChiTiet] = useState(null);
    const [chiTietSanPham, setChiTietSanPham] = useState([]);
    const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);

    const xemChiTietPhieuNhap = (pn) => {
        setPhieuDangXemChiTiet(pn);
        setHienModalChiTiet(true);
        setChiTietSanPham([]);
        setDangTaiChiTiet(true);

        axios.get(`http://localhost:8080/api/phieunhap_nhacungcap/${pn.maPN}/chitiet`)
            .then((res) => setChiTietSanPham(res.data || []))
            .catch((err) => {
                console.error("Lỗi lấy chi tiết phiếu nhập:", err);
                setChiTietSanPham([]);
            })
            .finally(() => setDangTaiChiTiet(false));
    };

    const tongCongChiTiet = chiTietSanPham.reduce(
        (tong, ct) => tong + (Number(ct.soLuong) || 0) * (Number(ct.giaNhap) || 0), 0
    );

    // ================= PHÂN TRANG TÍNH TOÁN =================
    const duLieuHienThi = tabDangChon === "nha-cung-cap" ? nccDaLoc : danhSachPhieuNhap;
    const trangHienTai = tabDangChon === "nha-cung-cap" ? trangNCC : trangPN;
    const setTrangHienTai = tabDangChon === "nha-cung-cap" ? setTrangNCC : setTrangPN;

    const tongSoTrang = Math.ceil(duLieuHienThi.length / soLuongMotTrang) || 1;
    const viTriBatDauTrang = (trangHienTai - 1) * soLuongMotTrang;
    const duLieuCatTrang = duLieuHienThi.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongMotTrang);
    const danhSachTrang = Array.from({ length: tongSoTrang }, (_, i) => i + 1);

    const dinhDangTien = (soTien) => Number(soTien || 0).toLocaleString("vi-VN");

    return (
        <div className="ncc-container">
            <div className="ncc-header">
                <h2>Nhà cung cấp & Nhập hàng</h2>
                <p>Xem quản lý kho vận, quản lý nhập hàng và thông tin nhà phân phối đối tác</p>
            </div>

            {/* TAB SWITCHER */}
            <div className="ncc-tabs">
                <button
                    className={`ncc-tab ${tabDangChon === "nha-cung-cap" ? "active" : ""}`}
                    onClick={() => { setTabDangChon("nha-cung-cap"); setTrangNCC(1); }}
                >
                    Nhà cung cấp
                </button>
                <button
                    className={`ncc-tab ${tabDangChon === "phieu-nhap" ? "active" : ""}`}
                    onClick={() => { setTabDangChon("phieu-nhap"); setTrangPN(1); }}
                >
                    Phiếu nhập hàng
                </button>
            </div>

            {/* NỘI DUNG TAB "NHÀ CUNG CẤP" */}
            {tabDangChon === "nha-cung-cap" && (
                <div className="ncc-tab-content">
                    <div className="ncc-toolbar">
                        <div className="ncc-search">
                            <i className="bx bx-search"></i>
                            <input
                                type="text"
                                placeholder="Tìm tên nhà cung cấp, SĐT..."
                                value={tuKhoaNCC}
                                onChange={(e) => { setTuKhoaNCC(e.target.value); setTrangNCC(1); }}
                            />
                        </div>
                        <button className="btn-add-ncc" onClick={moModalThemNCC}>+ Thêm NCC mới</button>
                    </div>

                    <table className="ncc-table">
                        <thead>
                            <tr>
                                <th>Mã NCC</th>
                                <th>Tên NCC</th>
                                <th>Địa chỉ</th>
                                <th>Số điện thoại</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {duLieuCatTrang.length > 0 ? (
                                duLieuCatTrang.map((ncc, i) => (
                                    <tr key={i}>
                                        <td>{ncc.maNCC}</td>
                                        <td>{ncc.tenNCC}</td>
                                        <td>{ncc.diaChi}</td>
                                        <td>{ncc.SDT}</td>
                                        <td>
                                            <span className={`badge ${ncc.trangThai === 1 ? "badge-red" : "badge-green"}`}>
                                                {ncc.trangThai === 1 ? "Ngừng hợp tác" : "Đang hợp tác"}
                                            </span>
                                        </td>
                                        <td className="ncc-actions">
                                            <button className="btn-edit" onClick={() => moModalSuaNCC(ncc)}>
                                                <i className="bx bx-pencil"></i> Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>Không tìm thấy nhà cung cấp nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* NỘI DUNG TAB "PHIẾU NHẬP HÀNG" */}
            {tabDangChon === "phieu-nhap" && (
                <div className="ncc-tab-content">
                    <div className="ncc-toolbar">
                        <div></div>
                        <button className="btn-add-ncc" onClick={() => setHienModalPhieuNhap(true)}>
                            + Tạo phiếu nhập mới
                        </button>
                    </div>

                    <table className="ncc-table">
                        <thead>
                            <tr>
                                <th>Mã phiếu</th>
                                <th>Nhà cung cấp</th>
                                <th>Ngày lập</th>
                                <th>Tổng tiền</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {duLieuCatTrang.length > 0 ? (
                                duLieuCatTrang.map((pn, i) => (
                                    <tr key={i}>
                                        <td>{pn.maPN}</td>
                                        <td>{pn.tenNCC}</td>
                                        <td>{pn.ngayLap ? new Date(pn.ngayLap).toLocaleDateString("vi-VN") : ""}</td>
                                        <td style={{ fontWeight: 600, color: "#1D4ED8" }}>đ{dinhDangTien(pn.tongTien)}</td>
                                        <td>
                                            <button className="btn-detail" onClick={() => xemChiTietPhieuNhap(pn)}>
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Chưa có phiếu nhập hàng nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FOOTER PHÂN TRANG CHUNG */}
            <div className="ncc-pagination-container">
                <span className="ncc-pagination-info">
                    Hiển thị {duLieuHienThi.length === 0 ? 0 : viTriBatDauTrang + 1} - {Math.min(viTriBatDauTrang + soLuongMotTrang, duLieuHienThi.length)} trên tổng số {duLieuHienThi.length} mục.
                </span>

                <div className="ncc-pagination-controls">
                    <button
                        className="ncc-pagination-btn"
                        onClick={() => setTrangHienTai(trangHienTai - 1)}
                        disabled={trangHienTai === 1}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>

                    {danhSachTrang.map((soTrang) => (
                        <button
                            key={soTrang}
                            className={`ncc-pagination-btn ${trangHienTai === soTrang ? "active" : ""}`}
                            onClick={() => setTrangHienTai(soTrang)}
                        >
                            {soTrang}
                        </button>
                    ))}

                    <button
                        className="ncc-pagination-btn"
                        onClick={() => setTrangHienTai(trangHienTai + 1)}
                        disabled={trangHienTai === tongSoTrang || tongSoTrang === 0}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* MODAL - THÊM / SỬA NHÀ CUNG CẤP */}
            {hienModalNCC && (
                <div className="modal-overlay" onClick={() => setHienModalNCC(false)}>
                    <div className="modal-box-phieunhap" style={{ width: "480px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{nccDangSua ? "Chỉnh sửa Nhà cung cấp" : "Thêm Nhà cung cấp mới"}</h3>
                            <button onClick={() => setHienModalNCC(false)}><i className="bx bx-x"></i></button>
                        </div>
                        <form onSubmit={xuLyLuuNCC} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className="modal-field">
                                <label>Tên nhà cung cấp *</label>
                                <input type="text" value={tenNCC} onChange={(e) => setTenNCC(e.target.value)} required />
                            </div>
                            <div className="modal-field">
                                <label>Số điện thoại *</label>
                                <input type="text" value={sdtNCC} onChange={(e) => setSdtNCC(e.target.value)} required />
                            </div>
                            <div className="modal-field">
                                <label>Địa chỉ *</label>
                                <input type="text" value={diaChiNCC} onChange={(e) => setDiaChiNCC(e.target.value)} required />
                            </div>
                            {nccDangSua && (
                                <div className="modal-field">
                                    <label>Trạng thái hợp tác *</label>
                                    <select value={trangThaiNCC} onChange={(e) => setTrangThaiNCC(Number(e.target.value))}>
                                        <option value={0}>Đang hợp tác</option>
                                        <option value={1}>Ngừng hợp tác</option>
                                    </select>
                                </div>
                            )}
                            <div className="modal-actions" style={{ marginTop: "10px" }}>
                                <button type="button" className="btn-cancel" onClick={() => setHienModalNCC(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu thông tin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL - TẠO PHIẾU NHẬP HÀNG MỚI */}
            {hienModalPhieuNhap && (
                <div className="modal-overlay" onClick={() => setHienModalPhieuNhap(false)}>
                    <div className="modal-box-phieunhap" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tạo phiếu nhập hàng mới</h3>
                            <button onClick={() => setHienModalPhieuNhap(false)}><i className="bx bx-x"></i></button>
                        </div>

                        <div className="modal-row">
                            <div className="modal-field">
                                <label>Chọn Nhà cung cấp *</label>
                                <select value={maNCCChon} onChange={(e) => setMaNCCChon(e.target.value)}>
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                   {danhSachNCC.filter(n => n.trangThai === 0 || n.trangThai === false || n.trangThai === "0").map((ncc, i) => (
                                        <option key={i} value={ncc.maNCC}>{ncc.tenNCC}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-field">
                                <label>Ngày lập phiếu</label>
                                <input type="text" value={new Date().toLocaleDateString("vi-VN")} readOnly />
                            </div>
                        </div>

                        <span className="modal-section-title">Danh sách sản phẩm nhập kho</span>

                        <table className="sp-nhap-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm *</th>
                                    <th>Số lượng</th>
                                    <th>Giá nhập (VNĐ)</th>
                                    <th>Hạn sử dụng</th>
                                    <th>Thành tiền</th>
                                    <th>Xóa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sanPhamNhap.map((sp, i) => (
                                    <tr key={i}>
                                        <td>
                                            <select
                                                value={sp.maSP}
                                                onChange={(e) => capNhatDongSanPham(i, "maSP", e.target.value)}
                                            >
                                                <option value="">-- Chọn sản phẩm --</option>
                                                {danhSachSanPham.map((item, k) => (
                                                    <option key={k} value={item.maSP}>{item.tenSP}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="0"
                                                value={sp.soLuong}
                                                onChange={(e) => capNhatDongSanPham(i, "soLuong", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={sp.giaNhap}
                                                onChange={(e) => capNhatDongSanPham(i, "giaNhap", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={sp.hanSuDung}
                                                onChange={(e) => capNhatDongSanPham(i, "hanSuDung", e.target.value)}
                                            />
                                        </td>
                                        <td className="thanh-tien">đ{dinhDangTien(tinhThanhTien(sp))}</td>
                                        <td>
                                            <button className="btn-xoa-dong" onClick={() => xoaDongSanPham(i)}>
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <button className="btn-them-dong" onClick={themDongSanPham}>
                            <i className="bx bx-plus"></i> Thêm dòng sản phẩm
                        </button>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setHienModalPhieuNhap(false)}>Hủy</button>
                            <div className="modal-total-actions">
                                <span className="modal-tong-cong">
                                    Tổng cộng: <strong>đ{dinhDangTien(tongCongPhieuDangTao)}</strong>
                                </span>
                                <button className="btn-save" onClick={luuPhieuNhap}>Lưu phiếu nhập</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL - CHI TIẾT PHIẾU NHẬP */}
            {hienModalChiTiet && phieuDangXemChiTiet && (
                <div className="modal-overlay" onClick={dongModalChiTiet => { setHienModalChiTiet(false); }}>
                    <div className="modal-box-phieunhap" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết phiếu nhập {phieuDangXemChiTiet.maPN}</h3>
                            <button onClick={() => setHienModalChiTiet(false)}><i className="bx bx-x"></i></button>
                        </div>

                        <div className="modal-row">
                            <div className="modal-field">
                                <label>Nhà cung cấp</label>
                                <input type="text" value={phieuDangXemChiTiet.tenNCC || ""} readOnly />
                            </div>
                            <div className="modal-field">
                                <label>Ngày nhập</label>
                                <input type="text" value={phieuDangXemChiTiet.ngayLap ? new Date(phieuDangXemChiTiet.ngayLap).toLocaleDateString("vi-VN") : ""} readOnly />
                            </div>
                        </div>

                        <span className="modal-section-title">Danh sách sản phẩm đã nhập</span>

                        <table className="sp-nhap-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Giá nhập (VNĐ)</th>
                                    <th>Hạn sử dụng</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dangTaiChiTiet ? (
                                    <tr><td colSpan="5" className="ct-trong">Đang tải dữ liệu...</td></tr>
                                ) : chiTietSanPham.length === 0 ? (
                                    <tr><td colSpan="5" className="ct-trong">Không có dữ liệu chi tiết</td></tr>
                                ) : (
                                    chiTietSanPham.map((ct, i) => (
                                        <tr key={i}>
                                            <td>{ct.tenSanPham}</td>
                                            <td>{ct.soLuong}</td>
                                            <td>{dinhDangTien(ct.giaNhap)}</td>
                                            <td>{ct.hanSuDung ? new Date(ct.hanSuDung).toLocaleDateString("vi-VN") : "Không có"}</td>
                                            <td className="thanh-tien">
                                                đ{dinhDangTien((Number(ct.soLuong) || 0) * (Number(ct.giaNhap) || 0))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="modal-actions">
                            <div></div>
                            <div className="modal-total-actions">
                                <span className="modal-tong-cong">
                                    Tổng cộng: <strong>đ{dinhDangTien(tongCongChiTiet)}</strong>
                                </span>
                                <button className="btn-cancel" onClick={() => setHienModalChiTiet(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NhaCungCap_NhapHang;