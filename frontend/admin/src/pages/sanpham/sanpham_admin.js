import React, { useState, useEffect, useRef } from "react";
import "./sanpham_admin.css";
import axios from "axios";
import Swal from "sweetalert2";

function SanPham() {
    // Dòng 7: đặt ngay dưới phần import, bên ngoài function component
    const isDangBan = (trangThai) =>
        trangThai === true || trangThai === 1 || trangThai === "1" || trangThai === "dang_ban";

    const [trangHienTai, setTrangHienTai] = useState(1);

    // ============== DANH SÁCH SẢN PHẨM ===========
    const [danhSachSanPham, setDanhSachSanPham] = useState([]);

    const taiLaiDanhSachSanPham = () => {
        axios.get("http://localhost:8080/api/sanpham")
            .then((response) => {
                setDanhSachSanPham(response.data);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiLaiDanhSachSanPham();

        // Tồn kho thay đổi liên tục (khách giữ hàng trong giỏ, hết hạn 15 phút, đặt hàng...)
        // -> tự làm mới mỗi 10 giây khi tab đang mở, và ngay khi quay lại tab này
        const dongHo = setInterval(() => {
            if (!document.hidden) taiLaiDanhSachSanPham();
        }, 10000);
        window.addEventListener("focus", taiLaiDanhSachSanPham);

        return () => {
            clearInterval(dongHo);
            window.removeEventListener("focus", taiLaiDanhSachSanPham);
        };
    }, []);

    // ============== BỘ LỌC ===========
    const [tuKhoa, setTuKhoa] = useState("");
    const [locHang, setLocHang] = useState("tat-ca");
    const [locLoaiSP, setLocLoaiSP] = useState("tat-ca");
    const [locTrangThai, setLocTrangThai] = useState("tat-ca");

    const danhSachHang = [...new Set(danhSachSanPham.map((sp) => sp.hang).filter(Boolean))];
    const danhSachLoai = [...new Set(danhSachSanPham.map((sp) => sp.tenLSP).filter(Boolean))];
    const danhSachDaLoc = danhSachSanPham.filter((sp) => {
        const khopTuKhoa =
            !tuKhoa ||
            (sp.tenSP || "").toLowerCase().includes(tuKhoa.toLowerCase()) ||
            (sp.maSP || "").toLowerCase().includes(tuKhoa.toLowerCase());
        const khopHang = locHang === "tat-ca" || sp.hang === locHang;
        const khopLoai = locLoaiSP === "tat-ca" || sp.tenLSP === locLoaiSP;

        const dangBan = isDangBan(sp.trangThai);
        const khopTrangThai =
            locTrangThai === "tat-ca" ||
            (locTrangThai === "dang_ban" && dangBan) ||
            (locTrangThai === "ngung_ban" && !dangBan);

        return khopTuKhoa && khopHang && khopLoai && khopTrangThai;
    });
    // ================= PHÂN TRANG =================
    const soLuongMotTrang = 10;
    const tongSoTrang = Math.ceil(danhSachDaLoc.length / soLuongMotTrang);
    const viTriBatDauTrang = (trangHienTai - 1) * soLuongMotTrang;
    const viTriHienThi = danhSachDaLoc.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongMotTrang);
    const danhSachTrang = Array.from({ length: tongSoTrang }, (_, i) => i + 1);

    const NGUONG_SAP_HET = 5;
    const dinhDangTien = (soTien) => (Number(soTien) || 0).toLocaleString("vi-VN");

    // ============== CHỌN NHIỀU DÒNG (checkbox) ===========
    const [cacDongDaChon, setCacDongDaChon] = useState([]);

    const chonTatCa = (e) => {
        setCacDongDaChon(e.target.checked ? viTriHienThi.map((sp) => sp.maSP) : []);
    };

    const chonMotDong = (maSP) => {
        setCacDongDaChon((prev) =>
            prev.includes(maSP) ? prev.filter((id) => id !== maSP) : [...prev, maSP]
        );
    };

    // ============== XÓA SẢN PHẨM ===========
    const xoaSanPham = (sp) => {
        Swal.fire({
            title: `Ngừng bán sản phẩm "${sp.tenSP}"?`,
            text: "Sản phẩm sẽ không hiển thị cho khách nữa, nhưng lịch sử đơn hàng/đánh giá liên quan vẫn được giữ nguyên.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ngừng bán",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#DC2626",
        }).then((ketQua) => {
            if (!ketQua.isConfirmed) return;
            axios.delete(`http://localhost:8080/api/sanpham/${sp.maSP}`)
                .then(() => {
                    taiLaiDanhSachSanPham();
                    Swal.fire("Đã cập nhật!", "", "success");
                })
                .catch((error) => {
                    console.error("Lỗi khi ngừng bán sản phẩm:", error);
                    Swal.fire("Lỗi!", "Không thể cập nhật sản phẩm", "error");
                });
        });
    };

    // =============== HÀM HELPER DÙNG CHUNG ==========
    const taoBienTheRong = () => ({ ten: "", giaChenhLech: 0, hinhAnh: "" });
    const taoThongSoRong = () => ({ ten: "", giaTri: "" });

    // ================== MODAL THÊM SẢN PHẨM MỚI =================
    const [hienModalThem, setHienModalThem] = useState(false);

    const spTrong = { tenSP: "", hang: "", tenLSP: "", giaBan: "", tonKho: "", badge: "", tag: "", donVi: "Chiếc" };
    const [spMoi, setSpMoi] = useState(spTrong);
    const capNhatSpMoi = (field, value) => setSpMoi({ ...spMoi, [field]: value });

    const [anhSanPham, setAnhSanPham] = useState([]);
    const [linkAnhThem, setLinkAnhThem] = useState(""); // State mới lưu nội dung input link ảnh
    const inputAnhRef = useRef(null);

    const themAnhTuFileList = (fileList, setter) => {
        const anhMoi = Array.from(fileList).map((file) => ({
            file,
            url: URL.createObjectURL(file),
            isLink: false
        }));
        setter((prev) => [...prev, ...anhMoi]);
    };

    const xuLyThemLinkAnh = () => {
        if (!linkAnhThem.trim()) return;
        setAnhSanPham((prev) => [...prev, { url: linkAnhThem.trim(), isLink: true }]);
        setLinkAnhThem("");
    };

    const xuLyChonAnh = (e) => {
        if (e.target.files?.length) themAnhTuFileList(e.target.files, setAnhSanPham);
    };
    const xuLyKeoTha = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) themAnhTuFileList(e.dataTransfer.files, setAnhSanPham);
    };
    const xoaAnh = (index) => setAnhSanPham((prev) => prev.filter((_, i) => i !== index));

    const [tabBienThe, setTabBienThe] = useState("dung-luong");
    // Sửa mảng mặc định thành đúng chuẩn CSDL
    const [bienTheDungLuong, setBienTheDungLuong] = useState([
        { ten: "128GB", giaChenhLech: 0, hinhAnh: "" },
        { ten: "256GB", giaChenhLech: 3000000, hinhAnh: "" },
    ]);
    const [bienTheMauSac, setBienTheMauSac] = useState([]);

    const danhSachBienTheHienTai = tabBienThe === "dung-luong" ? bienTheDungLuong : bienTheMauSac;
    const capNhatDanhSachBienThe = tabBienThe === "dung-luong" ? setBienTheDungLuong : setBienTheMauSac;

    const themBienThe = () => capNhatDanhSachBienThe([...danhSachBienTheHienTai, taoBienTheRong()]);
    const xoaBienThe = (index) => capNhatDanhSachBienThe(danhSachBienTheHienTai.filter((_, i) => i !== index));
    const capNhatBienThe = (index, field, value) => {
        const banSao = [...danhSachBienTheHienTai];
        banSao[index] = { ...banSao[index], [field]: value };
        capNhatDanhSachBienThe(banSao);
    };

    const [thongSoKyThuat, setThongSoKyThuat] = useState([
        { ten: "Màn hình", giaTri: "6.7 inch OLED 120Hz" },
        { ten: "Camera Sau", giaTri: "48MP + 12MP + 12MP" },
    ]);
    const themThongSo = () => setThongSoKyThuat([...thongSoKyThuat, taoThongSoRong()]);
    const xoaThongSo = (index) => setThongSoKyThuat(thongSoKyThuat.filter((_, i) => i !== index));
    const capNhatThongSo = (index, field, value) => {
        const banSao = [...thongSoKyThuat];
        banSao[index] = { ...banSao[index], [field]: value };
        setThongSoKyThuat(banSao);
    };

    const dongModalThem = () => {
        setHienModalThem(false);
        setSpMoi(spTrong);
        setAnhSanPham([]);
        setLinkAnhThem("");
        setBienTheDungLuong([]);
        setBienTheMauSac([]);
        setTabBienThe("dung-luong");
        setThongSoKyThuat([]);
    };

    const luuSanPham = () => {
        if (!spMoi.tenSP || !spMoi.hang || !spMoi.tenLSP || !spMoi.giaBan) {
            Swal.fire("Thiếu thông tin!", "Vui lòng điền đầy đủ các trường bắt buộc (*).", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("tenSP", spMoi.tenSP);
        formData.append("hang", spMoi.hang);
        formData.append("tenLSP", spMoi.tenLSP);
        formData.append("giaBan", spMoi.giaBan);
        formData.append("tonKho", spMoi.tonKho);
        formData.append("badge", spMoi.badge || "");
        formData.append("tag", spMoi.tag || "");
        formData.append("donVi", spMoi.donVi || "Chiếc");
        formData.append("bienTheDungLuong", JSON.stringify(bienTheDungLuong));
        formData.append("bienTheMauSac", JSON.stringify(bienTheMauSac));
        formData.append("thongSoKyThuat", JSON.stringify(thongSoKyThuat));

        // Tách riêng File tải lên và Link ảnh trên mạng
        const linkAnhs = anhSanPham.filter(a => a.isLink).map(a => a.url);
        formData.append("anhLinks", JSON.stringify(linkAnhs));
        anhSanPham.filter(a => !a.isLink).forEach((anh) => formData.append("anhSanPham", anh.file));

        axios.post("http://localhost:8080/api/sanpham/them", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
            .then(() => {
                Swal.fire("Thành công!", "Đã thêm sản phẩm mới", "success");
                taiLaiDanhSachSanPham();
                dongModalThem();
            })
            .catch((error) => {
                console.error("Lỗi khi lưu sản phẩm:", error);
                Swal.fire("Lỗi!", "Không thể thêm sản phẩm", "error");
            });
    };



    // =================== MODAL SỬA SẢN PHẨM ======================
    const [hienModalSua, setHienModalSua] = useState(false);
    const [spDangSua, setSpDangSua] = useState(null);

    const [formSua, setFormSua] = useState(spTrong);
    const capNhatFormSua = (field, value) => setFormSua({ ...formSua, [field]: value });

    const [anhSanPhamSua, setAnhSanPhamSua] = useState([]);
    const [linkAnhSua, setLinkAnhSua] = useState(""); // State mới lưu nội dung input link ảnh (Sửa)
    const inputAnhSuaRef = useRef(null);

    const xuLyThemLinkAnhSua = () => {
        if (!linkAnhSua.trim()) return;
        setAnhSanPhamSua((prev) => [...prev, { url: linkAnhSua.trim(), isLink: true, isCu: false }]);
        setLinkAnhSua("");
    };

    const xuLyChonAnhSua = (e) => {
        if (e.target.files?.length) themAnhTuFileList(e.target.files, setAnhSanPhamSua);
    };
    const xuLyKeoThaSua = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) themAnhTuFileList(e.dataTransfer.files, setAnhSanPhamSua);
    };
    const xoaAnhSua = (index) => setAnhSanPhamSua((prev) => prev.filter((_, i) => i !== index));

    const [tabBienTheSua, setTabBienTheSua] = useState("dung-luong");
    const [bienTheDungLuongSua, setBienTheDungLuongSua] = useState([]);
    const [bienTheMauSacSua, setBienTheMauSacSua] = useState([]);

    const danhSachBienTheHienTaiSua = tabBienTheSua === "dung-luong" ? bienTheDungLuongSua : bienTheMauSacSua;
    const capNhatDanhSachBienTheSua = tabBienTheSua === "dung-luong" ? setBienTheDungLuongSua : setBienTheMauSacSua;

    const themBienTheSua = () => capNhatDanhSachBienTheSua([...danhSachBienTheHienTaiSua, taoBienTheRong()]);
    const xoaBienTheSua = (index) => capNhatDanhSachBienTheSua(danhSachBienTheHienTaiSua.filter((_, i) => i !== index));
    const capNhatBienTheSua = (index, field, value) => {
        const banSao = [...danhSachBienTheHienTaiSua];
        banSao[index] = { ...banSao[index], [field]: value };
        capNhatDanhSachBienTheSua(banSao);
    };

    const [thongSoKyThuatSua, setThongSoKyThuatSua] = useState([]);
    const themThongSoSua = () => setThongSoKyThuatSua([...thongSoKyThuatSua, taoThongSoRong()]);
    const xoaThongSoSua = (index) => setThongSoKyThuatSua(thongSoKyThuatSua.filter((_, i) => i !== index));
    const capNhatThongSoSua = (index, field, value) => {
        const banSao = [...thongSoKyThuatSua];
        banSao[index] = { ...banSao[index], [field]: value };
        setThongSoKyThuatSua(banSao);
    };

    const moModalSua = async (sp) => {
        setSpDangSua(sp);
        setFormSua({
            tenSP: sp.tenSP || "",
            hang: sp.hang || "",
            tenLSP: sp.tenLSP || "",
            giaBan: sp.giaBan || "",
            tonKho: sp.tonKho || "",
            badge: sp.badge || "",
            tag: sp.tag || "",
            donVi: sp.donVi || "Chiếc",
            trangThai: isDangBan(sp.trangThai) ? "dang_ban" : "ngung_ban",
        });
        setAnhSanPhamSua(sp.hinhAnh ? [{ url: sp.hinhAnh, isCu: true }] : []);
        setTabBienTheSua("dung-luong");

        try {
            const res = await axios.get(`http://localhost:8080/api/sanpham/chitiet/${sp.maSP}`);
            const data = res.data;

            // Map từ CSDL (giaTri) sang format của Form (ten)
            const mapBT = (arr) => arr.map(item => ({
                ten: item.giaTri,
                giaChenhLech: item.giaChenhLech || 0,
                hinhAnh: item.hinhAnh || ""
            }));

            setBienTheDungLuongSua(mapBT(data.bienTheDungLuong || []));
            setBienTheMauSacSua(mapBT(data.bienTheMauSac || []));
            setThongSoKyThuatSua(data.thongSoKyThuat || []);
        } catch (error) {
            console.error("Lỗi lấy chi tiết sản phẩm:", error);
            setBienTheDungLuongSua([]);
            setBienTheMauSacSua([]);
            setThongSoKyThuatSua([]);
        }

        setHienModalSua(true);
    };

    const dongModalSua = () => {
        setHienModalSua(false);
        setSpDangSua(null);
        setFormSua(spTrong);
        setAnhSanPhamSua([]);
        setLinkAnhSua("");
        setBienTheDungLuongSua([]);
        setBienTheMauSacSua([]);
        setTabBienTheSua("dung-luong");
        setThongSoKyThuatSua([]);
    };

    const luuSuaSanPham = () => {
        if (!formSua.tenSP || !formSua.hang || !formSua.tenLSP || !formSua.giaBan) {
            Swal.fire("Thiếu thông tin!", "Vui lòng điền đầy đủ các trường bắt buộc (*).", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("tenSP", formSua.tenSP);
        formData.append("hang", formSua.hang);
        formData.append("tenLSP", formSua.tenLSP);
        formData.append("giaBan", formSua.giaBan);
        formData.append("tonKho", formSua.tonKho);
        formData.append("badge", formSua.badge || "");
        formData.append("tag", formSua.tag || "");
        formData.append("donVi", formSua.donVi || "Chiếc");
        formData.append("trangThai", formSua.trangThai);
        formData.append("bienTheDungLuong", JSON.stringify(bienTheDungLuongSua));
        formData.append("bienTheMauSac", JSON.stringify(bienTheMauSacSua));
        formData.append("thongSoKyThuat", JSON.stringify(thongSoKyThuatSua));

        // Ảnh cũ
        const anhCuConGiu = anhSanPhamSua.filter((a) => a.isCu).map((a) => a.url);
        formData.append("anhCu", JSON.stringify(anhCuConGiu));

        // Ảnh dạng Link mới thêm
        const linkAnhsMoi = anhSanPhamSua.filter(a => a.isLink && !a.isCu).map(a => a.url);
        formData.append("anhLinks", JSON.stringify(linkAnhsMoi));

        // Ảnh upload dạng File
        anhSanPhamSua.filter((a) => !a.isCu && !a.isLink).forEach((anh) => formData.append("anhSanPham", anh.file));

        axios.put(`http://localhost:8080/api/sanpham/sua/${spDangSua.maSP}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
            .then(() => {
                Swal.fire("Thành công!", "Đã cập nhật sản phẩm", "success");
                taiLaiDanhSachSanPham();
                dongModalSua();
            })
            .catch((error) => {
                console.error("Lỗi khi cập nhật sản phẩm:", error);
                Swal.fire("Lỗi!", "Không thể cập nhật sản phẩm", "error");
            });
    };

    return (
        <div className="sp-container">
            <div className="sp-header">
                <span className="sp-title">Quản lý sản phẩm</span>
                <button className="sp-btn-them" onClick={() => setHienModalThem(true)}>
                    <i className="bx bx-plus bx-remove-padding" />
                    Thêm sản phẩm mới
                </button>
            </div>

            <div className="sp-toolbar">
                {/* Search & Filters giữ nguyên... */}
                <div className="sp-search">
                    <i className="bx bx-search"></i>
                    <input
                        type="search"
                        placeholder="Tìm mã sản phẩm, tên sản phẩm...."
                        value={tuKhoa}
                        onChange={(e) => setTuKhoa(e.target.value)}
                    />
                </div>
                <div className="sp-filter">
                    <label>Lọc theo hãng:</label>
                    <select value={locHang} onChange={(e) => setLocHang(e.target.value)}>
                        <option value="tat-ca">Tất cả</option>
                        {danhSachHang.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                </div>
                <div className="sp-filter">
                    <label>Loại sản phẩm:</label>
                    <select value={locLoaiSP} onChange={(e) => setLocLoaiSP(e.target.value)}>
                        <option value="tat-ca">Tất cả</option>
                        {danhSachLoai.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <div className="sp-filter">
                    <label>Trạng thái:</label>
                    <select value={locTrangThai} onChange={(e) => setLocTrangThai(e.target.value)}>
                        <option value="tat-ca">Tất cả</option>
                        <option value="dang_ban">Đang bán</option>
                        <option value="ngung_ban">Ngừng bán</option>
                    </select>
                </div>
            </div>

            <table className="sp-table">
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                onChange={chonTatCa}
                                checked={viTriHienThi.length > 0 && cacDongDaChon.length === viTriHienThi.length}
                            />
                        </th>
                        <th>Sản phẩm</th>
                        <th>Giá bán</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {viTriHienThi.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="sp-trong">Không tìm thấy sản phẩm nào.</td>
                        </tr>
                    ) : (
                        viTriHienThi.map((sp, i) => (
                            <tr key={sp.maSP ?? i}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={cacDongDaChon.includes(sp.maSP)}
                                        onChange={() => chonMotDong(sp.maSP)}
                                    />
                                </td>
                                <td>
                                    <div className="sp-info-cell">
                                        <img src={sp.hinhAnh} alt="" className="sp-thumb" />
                                        <div className="sp-info-text">
                                            <span className="sp-ten">{sp.tenSP}</span>
                                            <span className="sp-loai">{sp.hang} - {sp.tenLSP}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="sp-gia">đ{dinhDangTien(sp.giaBan)}</td>
                                <td>
                                    <div className="sp-tonkho-cell">
                                        <span>{sp.tonKho} chiếc</span>
                                        {Number(sp.tonKho) === 0 ? (
                                            <span className="sp-badge badge-do">Hết hàng</span>
                                        ) : Number(sp.tonKho) <= NGUONG_SAP_HET ? (
                                            <span className="sp-badge badge-cam">Sắp hết</span>
                                        ) : null}
                                    </div>
                                </td>

                                <td>
                                    <span className={`sp-badge ${isDangBan(sp.trangThai) ? "badge-xanh" : "badge-xam"}`}>
                                        {isDangBan(sp.trangThai) ? "Đang bán" : "Ngừng bán"}
                                    </span>
                                </td>
                                <td className="sp-actions">
                                    <button className="sp-btn-sua" onClick={() => moModalSua(sp)}>
                                        <i className="bx bx-pencil"></i>
                                    </button>
                                    <button className="sp-btn-xoa" onClick={() => xoaSanPham(sp)}>
                                        <i className="bx bx-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* PHÂN TRANG */}
            <div className="sp-pagination-container">
                <span className="sp-pagination-info">
                    Hiển thị {danhSachDaLoc.length === 0 ? 0 : viTriBatDauTrang + 1} - {Math.min(viTriBatDauTrang + soLuongMotTrang, danhSachDaLoc.length)} trên tổng số {danhSachDaLoc.length} sản phẩm.
                </span>
                <div className="sp-pagination-controls">
                    <button
                        className="sp-pagination-btn"
                        onClick={() => setTrangHienTai(trangHienTai - 1)}
                        disabled={trangHienTai === 1}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>
                    {danhSachTrang.map((soTrang) => (
                        <button
                            key={soTrang}
                            className={`sp-pagination-btn ${trangHienTai === soTrang ? "active" : ""}`}
                            onClick={() => setTrangHienTai(soTrang)}
                        >
                            {soTrang}
                        </button>
                    ))}
                    <button
                        className="sp-pagination-btn"
                        onClick={() => setTrangHienTai(trangHienTai + 1)}
                        disabled={trangHienTai === tongSoTrang || tongSoTrang === 0}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* ============== MODAL THÊM SẢN PHẨM MỚI ============== */}
            {hienModalThem && (
                <div className="modal-overlay" onClick={dongModalThem}>
                    <div className="modal-box-sp" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Thêm sản phẩm mới</h3>
                            <button onClick={dongModalThem}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="sp-modal-grid">
                            <div className="sp-modal-col">
                                <div className="modal-field">
                                    <label>Tên sản phẩm *</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập tên đầy đủ (ví dụ: Apple iPhone 15 Pro Max)"
                                        value={spMoi.tenSP}
                                        onChange={(e) => capNhatSpMoi("tenSP", e.target.value)}
                                    />
                                </div>

                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label>Hãng sản xuất *</label>
                                        <input
                                            type="text"
                                            placeholder="VD: Apple"
                                            list="ds-hang-sx"
                                            value={spMoi.hang}
                                            onChange={(e) => capNhatSpMoi("hang", e.target.value)}
                                        />
                                        <datalist id="ds-hang-sx">
                                            {danhSachHang.map((h) => <option key={h} value={h} />)}
                                        </datalist>
                                    </div>
                                    <div className="modal-field">
                                        <label>Loại sản phẩm *</label>
                                        <input
                                            type="text"
                                            placeholder="VD: Điện thoại"
                                            list="ds-loai-sp"
                                            value={spMoi.tenLSP}
                                            onChange={(e) => capNhatSpMoi("tenLSP", e.target.value)}
                                        />
                                        <datalist id="ds-loai-sp">
                                            {danhSachLoai.map((l) => <option key={l} value={l} />)}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label>Giá bán lẻ (VNĐ) *</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={spMoi.giaBan}
                                            onChange={(e) => capNhatSpMoi("giaBan", e.target.value)}
                                        />
                                    </div>
                                    <div className="modal-field">
                                        <label>Số lượng tồn kho ban đầu *</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={spMoi.tonKho}
                                            onChange={(e) => capNhatSpMoi("tonKho", e.target.value)}
                                        />
                                    </div>
                                    <div className="modal-row">
                                        <div className="modal-field">
                                            <label>Đơn vị tính</label>
                                            <input
                                                type="text"
                                                placeholder="VD: Chiếc, Cái, Hộp"
                                                value={hienModalThem ? spMoi.donVi : formSua.donVi}
                                                onChange={(e) => hienModalThem ? capNhatSpMoi("donVi", e.target.value) : capNhatFormSua("donVi", e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-field">
                                            <label>Badge (Nhãn nổi bật)</label>
                                            <input
                                                type="text"
                                                placeholder="VD: BÁN CHẠY, HOT"
                                                value={hienModalThem ? spMoi.badge : formSua.badge}
                                                onChange={(e) => hienModalThem ? capNhatSpMoi("badge", e.target.value) : capNhatFormSua("badge", e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-field">
                                            <label>Tag (Ghi chú nhỏ)</label>
                                            <input
                                                type="text"
                                                placeholder="VD: Trả góp 0%"
                                                value={hienModalThem ? spMoi.tag : formSua.tag}
                                                onChange={(e) => hienModalThem ? capNhatSpMoi("tag", e.target.value) : capNhatFormSua("tag", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-field">
                                    <label>Hình ảnh sản phẩm *</label>
                                    <div
                                        className="sp-upload-zone"
                                        onClick={() => inputAnhRef.current.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={xuLyKeoTha}
                                    >
                                        <i className="bx bx-camera"></i>
                                        <span className="sp-upload-title">Kéo thả hoặc bấm để tải ảnh lên</span>
                                        <span className="sp-upload-hint">Hỗ trợ JPG, PNG lên đến 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            ref={inputAnhRef}
                                            onChange={xuLyChonAnh}
                                            hidden
                                        />
                                    </div>

                                    {/* KHU VỰC THÊM LINK ẢNH DÀNH CHO FORM THÊM */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="Hoặc dán URL link ảnh vào đây..."
                                            value={linkAnhThem}
                                            onChange={(e) => setLinkAnhThem(e.target.value)}
                                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={xuLyThemLinkAnh}
                                            style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: '500' }}
                                        >
                                            Thêm Link
                                        </button>
                                    </div>

                                    {anhSanPham.length > 0 && (
                                        <div className="sp-anh-preview-list">
                                            {anhSanPham.map((anh, i) => (
                                                <div className="sp-anh-preview-item" key={i}>
                                                    <img src={anh.url} alt="" />
                                                    <button className="sp-anh-xoa" onClick={() => xoaAnh(i)}>
                                                        <i className="bx bx-x"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sp-modal-col">
                                {/* Biến thể & Thông số giữ nguyên */}
                                <div className="sp-modal-section">
                                    <span className="sp-modal-section-title">Biến thể sản phẩm</span>
                                    <div className="sp-bienthe-tabs">
                                        <button
                                            className={`sp-bienthe-tab ${tabBienThe === "dung-luong" ? "active" : ""}`}
                                            onClick={() => setTabBienThe("dung-luong")}
                                        >
                                            Dung lượng
                                        </button>
                                        <button
                                            className={`sp-bienthe-tab ${tabBienThe === "mau-sac" ? "active" : ""}`}
                                            onClick={() => setTabBienThe("mau-sac")}
                                        >
                                            Màu sắc
                                        </button>
                                    </div>

                                    {danhSachBienTheHienTai.map((bt, i) => (
                                        <div className="sp-bienthe-row" key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder={tabBienThe === "dung-luong" ? "VD: 128GB" : "VD: Đen"}
                                                value={bt.ten}
                                                onChange={(e) => capNhatBienThe(i, "ten", e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Tiền chênh lệch"
                                                value={bt.giaChenhLech}
                                                onChange={(e) => capNhatBienThe(i, "giaChenhLech", e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            {/* HIỂN THỊ THÊM INPUT ẢNH NẾU ĐANG Ở TAB MÀU SẮC */}
                                            {tabBienThe === "mau-sac" && (
                                                <input
                                                    type="text"
                                                    placeholder="Link ảnh màu"
                                                    value={bt.hinhAnh}
                                                    onChange={(e) => capNhatBienThe(i, "hinhAnh", e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                            )}
                                            <button type="button" className="sp-btn-xoa-dong" onClick={() => xoaBienThe(i)}>
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button className="sp-btn-them-dong" onClick={themBienThe}>
                                        <i className="bx bx-plus"></i> Thêm biến thể
                                    </button>
                                </div>

                                <div className="sp-modal-section">
                                    <span className="sp-modal-section-title">Thông số kỹ thuật</span>
                                    {thongSoKyThuat.map((ts, i) => (
                                        <div className="sp-bienthe-row" key={i}>
                                            <input
                                                type="text"
                                                placeholder="Tên thông số"
                                                value={ts.ten}
                                                onChange={(e) => capNhatThongSo(i, "ten", e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Giá trị"
                                                value={ts.giaTri}
                                                onChange={(e) => capNhatThongSo(i, "giaTri", e.target.value)}
                                            />
                                            <button className="sp-btn-xoa-dong" onClick={() => xoaThongSo(i)}>
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button className="sp-btn-them-dong" onClick={themThongSo}>
                                        <i className="bx bx-plus"></i> Thêm thông số
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={dongModalThem}>Hủy</button>
                            <button className="btn-save" onClick={luuSanPham}>Lưu sản phẩm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============== MODAL SỬA SẢN PHẨM ============== */}
            {hienModalSua && spDangSua && (
                <div className="modal-overlay" onClick={dongModalSua}>
                    <div className="modal-box-sp" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Sửa sản phẩm - {spDangSua.tenSP}</h3>
                            <button onClick={dongModalSua}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="sp-modal-grid">
                            <div className="sp-modal-col">
                                <div className="modal-field">
                                    <label>Tên sản phẩm *</label>
                                    <input
                                        type="text"
                                        value={formSua.tenSP}
                                        onChange={(e) => capNhatFormSua("tenSP", e.target.value)}
                                    />
                                </div>

                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label>Hãng sản xuất *</label>
                                        <input
                                            type="text"
                                            list="ds-hang-sx-sua"
                                            value={formSua.hang}
                                            onChange={(e) => capNhatFormSua("hang", e.target.value)}
                                        />
                                        <datalist id="ds-hang-sx-sua">
                                            {danhSachHang.map((h) => <option key={h} value={h} />)}
                                        </datalist>
                                    </div>
                                    <div className="modal-field">
                                        <label>Loại sản phẩm *</label>
                                        <input
                                            type="text"
                                            list="ds-loai-sp-sua"
                                            value={formSua.tenLSP}
                                            onChange={(e) => capNhatFormSua("tenLSP", e.target.value)}
                                        />
                                        <datalist id="ds-loai-sp-sua">
                                            {danhSachLoai.map((l) => <option key={l} value={l} />)}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label>Giá bán lẻ (VNĐ) *</label>
                                        <input
                                            type="number"
                                            value={formSua.giaBan}
                                            onChange={(e) => capNhatFormSua("giaBan", e.target.value)}
                                        />
                                    </div>
                                    <div className="modal-field">
                                        <label>Số lượng tồn kho *</label>
                                        <input
                                            type="number"
                                            value={formSua.tonKho}
                                            onChange={(e) => capNhatFormSua("tonKho", e.target.value)}
                                        />
                                    </div>
                                    <div className="modal-row">
                                        <div className="modal-field">
                                            <label>Đơn vị tính</label>
                                            <input
                                                type="text"
                                                placeholder="VD: Chiếc, Cái, Hộp"
                                                value={hienModalThem ? spMoi.donVi : formSua.donVi}
                                                onChange={(e) => hienModalThem ? capNhatSpMoi("donVi", e.target.value) : capNhatFormSua("donVi", e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-field">
                                            <label>Badge (Nhãn nổi bật)</label>
                                            <input
                                                type="text"
                                                placeholder="VD: BÁN CHẠY, HOT"
                                                value={hienModalThem ? spMoi.badge : formSua.badge}
                                                onChange={(e) => hienModalThem ? capNhatSpMoi("badge", e.target.value) : capNhatFormSua("badge", e.target.value)}
                                            />
                                        </div>
                                        <div className="modal-field">
                                            <label>Tag (Ghi chú nhỏ)</label>
                                            <input
                                                type="text"
                                                placeholder="VD: Trả góp 0%"
                                                value={hienModalThem ? spMoi.tag : formSua.tag}
                                                onChange={(e) => hienModalThem ? capNhatSpMoi("tag", e.target.value) : capNhatFormSua("tag", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-field">
                                    <label>Trạng thái</label>
                                    <select
                                        value={formSua.trangThai}
                                        onChange={(e) => capNhatFormSua("trangThai", e.target.value)}
                                    >
                                        <option value="dang_ban">Đang bán</option>
                                        <option value="ngung_ban">Ngừng bán</option>
                                    </select>
                                </div>

                                <div className="modal-field">
                                    <label>Hình ảnh sản phẩm</label>
                                    <div
                                        className="sp-upload-zone"
                                        onClick={() => inputAnhSuaRef.current.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={xuLyKeoThaSua}
                                    >
                                        <i className="bx bx-camera"></i>
                                        <span className="sp-upload-title">Kéo thả hoặc bấm để thêm ảnh mới</span>
                                        <span className="sp-upload-hint">Hỗ trợ JPG, PNG lên đến 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            ref={inputAnhSuaRef}
                                            onChange={xuLyChonAnhSua}
                                            hidden
                                        />
                                    </div>

                                    {/* KHU VỰC THÊM LINK ẢNH DÀNH CHO FORM SỬA */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="Hoặc dán URL link ảnh vào đây..."
                                            value={linkAnhSua}
                                            onChange={(e) => setLinkAnhSua(e.target.value)}
                                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={xuLyThemLinkAnhSua}
                                            style={{ padding: '8px 12px', background: '#3b82f6', color: '#fff', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: '500' }}
                                        >
                                            Thêm Link
                                        </button>
                                    </div>

                                    {anhSanPhamSua.length > 0 && (
                                        <div className="sp-anh-preview-list">
                                            {anhSanPhamSua.map((anh, i) => (
                                                <div className="sp-anh-preview-item" key={i}>
                                                    <img src={anh.url} alt="" />
                                                    <button className="sp-anh-xoa" onClick={() => xoaAnhSua(i)}>
                                                        <i className="bx bx-x"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sp-modal-col">
                                <div className="sp-modal-section">
                                    <span className="sp-modal-section-title">Biến thể sản phẩm</span>
                                    <div className="sp-bienthe-tabs">
                                        <button
                                            className={`sp-bienthe-tab ${tabBienTheSua === "dung-luong" ? "active" : ""}`}
                                            onClick={() => setTabBienTheSua("dung-luong")}
                                        >
                                            Dung lượng
                                        </button>
                                        <button
                                            className={`sp-bienthe-tab ${tabBienTheSua === "mau-sac" ? "active" : ""}`}
                                            onClick={() => setTabBienTheSua("mau-sac")}
                                        >
                                            Màu sắc
                                        </button>
                                    </div>

                                    {danhSachBienTheHienTaiSua.map((bt, i) => (
                                        <div className="sp-bienthe-row" key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder={tabBienTheSua === "dung-luong" ? "VD: 128GB" : "VD: Đen"}
                                                value={bt.ten || ""}
                                                onChange={(e) => capNhatBienTheSua(i, "ten", e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Tiền chênh lệch"
                                                value={bt.giaChenhLech === 0 ? 0 : (bt.giaChenhLech || "")}
                                                onChange={(e) => capNhatBienTheSua(i, "giaChenhLech", e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            {/* HIỂN THỊ THÊM INPUT ẢNH NẾU ĐANG Ở TAB MÀU SẮC */}
                                            {tabBienTheSua === "mau-sac" && (
                                                <input
                                                    type="text"
                                                    placeholder="Link ảnh màu"
                                                    value={bt.hinhAnh || ""}
                                                    onChange={(e) => capNhatBienTheSua(i, "hinhAnh", e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                            )}
                                            <button type="button" className="sp-btn-xoa-dong" onClick={() => xoaBienTheSua(i)}>
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button className="sp-btn-them-dong" onClick={themBienTheSua}>
                                        <i className="bx bx-plus"></i> Thêm biến thể
                                    </button>
                                </div>

                                <div className="sp-modal-section">
                                    <span className="sp-modal-section-title">Thông số kỹ thuật</span>
                                    {thongSoKyThuatSua.map((ts, i) => (
                                        <div className="sp-bienthe-row" key={i}>
                                            <input
                                                type="text"
                                                placeholder="Tên thông số"
                                                value={ts.ten}
                                                onChange={(e) => capNhatThongSoSua(i, "ten", e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Giá trị"
                                                value={ts.giaTri}
                                                onChange={(e) => capNhatThongSoSua(i, "giaTri", e.target.value)}
                                            />
                                            <button className="sp-btn-xoa-dong" onClick={() => xoaThongSoSua(i)}>
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button className="sp-btn-them-dong" onClick={themThongSoSua}>
                                        <i className="bx bx-plus"></i> Thêm thông số
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={dongModalSua}>Hủy</button>
                            <button className="btn-save" onClick={luuSuaSanPham}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SanPham;