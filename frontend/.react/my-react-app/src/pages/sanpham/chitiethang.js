import React, { useState, useEffect } from "react";
import "./chitiethang.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import { wishlistApi } from "../../API/WishlistApi";
import { userSession } from "../../utils/UserSession";
import { productApi } from "../../API/ProductApi";
import { layUrlAnh } from "../../utils/imageUrl";

// Các mức lọc hiển thị trên giao diện
const DS_RAM = ["4GB", "6GB", "8GB", "12GB", "16GB"];
const DS_ROM = ["64GB", "128GB", "256GB", "512GB", "1TB"];

// Rút các mức dung lượng từ chuỗi bất kỳ: "128 GB", "8GB LPDDR5X", "256GB / 512GB", "1 TB"...
// -> ["128GB"], ["8GB"], ["256GB", "512GB"], ["1TB"]
const layDungLuong = (danhSachChuoi) => {
    const ketQua = new Set();
    (danhSachChuoi || []).forEach((chuoi) => {
        const khop = String(chuoi).matchAll(/(\d+(?:[.,]\d+)?)\s*(GB|TB)/gi);
        for (const m of khop) {
            ketQua.add(`${m[1].replace(",", ".")}${m[2].toUpperCase()}`);
        }
    });
    return [...ketQua];
};

// Header dùng "Khác" cho mục "Phụ kiện Công nghệ", nên nút hãng "Phụ Kiện" cũng trỏ về "Khác"
const giaTriHang = (th) => (/phụ\s*kiện/i.test(th.tenThuongHieu) ? "Khác" : th.tenThuongHieu);
const cungHang = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

function SanPhamCacHang() {

    // GHI CHÚ: tham số trên URL thực chất là TÊN HÃNG (VD "Apple", "Samsung", "Khác")
    // vì Header dẫn tới /home/hang/Apple và backend lọc theo cột SanPham.hang.
    // Tên param trong route vẫn là ":maThuongHieu" nên đổi tên biến ở đây cho đỡ nhầm.
    const { maThuongHieu: tenHang } = useParams();
    const navigate = useNavigate();

    // ============== YÊU THÍCH (thả tim) ===========
    const [danhSachTym, setDanhSachTym] = useState([]);
    const nguoiDung = userSession.get();
    const maKH = nguoiDung?.maKH;

    useEffect(() => {
        if (!maKH) return;
        wishlistApi.list(maKH)
            .then((data) => setDanhSachTym(data.map((sp) => sp.maSP)))
            .catch((err) => console.error("Lỗi tải danh sách tim:", err));
    }, [maKH]);

    const xuLyTym = async (maSP) => {
        if (!maKH) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào mục Yêu thích!");
            return;
        }
        try {
            const res = await wishlistApi.toggle(maKH, maSP);
            if (res.success) {
                if (res.action === 'added') {
                    setDanhSachTym((prev) => [...prev, maSP]);
                } else {
                    setDanhSachTym((prev) => prev.filter((id) => id !== maSP));
                }
            }
        } catch (error) {
            console.error("Lỗi khi thả tim:", error);
        }
    };

    const [hienThiBoLoc, setHienThiBoLoc] = useState(false);

    // ============== DANH SÁCH THƯƠNG HIỆU (để render nút lọc "Hãng sản xuất") ===========
    const [danhSachThuongHieu, setDanhSachThuongHieu] = useState([]);

    useEffect(() => {
        productApi.getBrands()
            .then((data) => setDanhSachThuongHieu(data))
            .catch((error) => console.error("Lỗi khi lấy danh sách thương hiệu:", error));
    }, []);

    // Thương hiệu đang xem (để hiện lên breadcrumb), lấy từ danh sách vừa tải
    const thuongHieuHienTai = danhSachThuongHieu.find((th) => cungHang(giaTriHang(th), tenHang));

    // ============== BỘ LỌC RAM / ROM (chọn nhiều mức; trong 1 nhóm là HOẶC, giữa 2 nhóm là VÀ) ===========
    const [ramDaChon, setRamDaChon] = useState([]);
    const [romDaChon, setRomDaChon] = useState([]);
    const soBoLocDangChon = ramDaChon.length + romDaChon.length;

    // ============== DANH SÁCH SẢN PHẨM THEO THƯƠNG HIỆU ===========
    const [sanPhamTheoHang, setSanPhamTheoHang] = useState([]);
    const [dangTai, setDangTai] = useState(true);

    // ============== PHÂN TRANG ===========
    const soLuongMotTrang = 8;
    const [trangHienTai, setTrangHienTai] = useState(1);

    useEffect(() => {
        // Đổi hãng thì xóa các lựa chọn RAM/ROM cũ
        setRamDaChon([]);
        setRomDaChon([]);

        if (!tenHang) {
            console.warn("SanPhamCacHang: không nhận được tên hãng từ URL. Kiểm tra lại route và Link trỏ vào trang này.");
            setDangTai(false);
            setSanPhamTheoHang([]);
            return;
        }

        setDangTai(true);
        productApi.getByBrand(tenHang)
            .then((data) => {
                // Chuẩn hóa sẵn RAM/ROM của từng sản phẩm để lọc cho nhanh
                const danhSach = data.map((sp) => ({
                    ...sp,
                    _ram: layDungLuong(sp.ram),
                    _rom: layDungLuong(sp.rom),
                }));
                setSanPhamTheoHang(danhSach);
                setTrangHienTai(1);
            })
            .catch((error) => console.error("Lỗi khi lấy sản phẩm theo thương hiệu:", error))
            .finally(() => setDangTai(false));
    }, [tenHang]);

    // Bấm 1 mức RAM/ROM: chọn thêm, bấm lại để bỏ chọn
    const chonLoc = (nhom, giaTri) => {
        const capNhat = nhom === "ram" ? setRamDaChon : setRomDaChon;
        capNhat((cu) => (cu.includes(giaTri) ? cu.filter((x) => x !== giaTri) : [...cu, giaTri]));
        setTrangHienTai(1);
    };

    const xoaBoLoc = () => {
        setRamDaChon([]);
        setRomDaChon([]);
        setTrangHienTai(1);
    };

    // Số sản phẩm của hãng này có mỗi mức RAM/ROM (mức nào không có sản phẩm thì làm mờ, không cho bấm)
    const demTheoMuc = (truong, muc) => sanPhamTheoHang.filter((sp) => sp[truong].includes(muc)).length;

    // ============== ÁP DỤNG BỘ LỌC ===========
    const sanPhamDaLoc = sanPhamTheoHang.filter((sp) => {
        const khopRam = ramDaChon.length === 0 || ramDaChon.some((r) => sp._ram.includes(r));
        const khopRom = romDaChon.length === 0 || romDaChon.some((r) => sp._rom.includes(r));
        return khopRam && khopRom;
    });

    // ============== SẮP XẾP ===========
    // GIẢ ĐỊNH: "Bán chạy nhất" xếp theo soLuongDanhGia giảm dần (chưa có cột
    // "đã bán" thật trong schema); "Hàng mới về" xếp theo maSP giảm dần
    // (chưa có cột ngày tạo thật) - nên đổi lại khi bạn bổ sung các cột này.
    const [kieuSapXep, setKieuSapXep] = useState("ban-chay");

    const sanPhamDaSapXep = [...sanPhamDaLoc].sort((a, b) => {
        if (kieuSapXep === "gia-tang") return a.giaBan - b.giaBan;
        if (kieuSapXep === "gia-giam") return b.giaBan - a.giaBan;
        if (kieuSapXep === "moi-ve") return String(b.maSP).localeCompare(String(a.maSP));
        // mặc định: bán chạy nhất
        return (b.soLuongDanhGia || 0) - (a.soLuongDanhGia || 0);
    });

    // ============== PHÂN TRANG (tính trên danh sách đã lọc) ===========
    const tinhSoTrang = Math.ceil(sanPhamDaSapXep.length / soLuongMotTrang);
    const viTriBatDau = (trangHienTai - 1) * soLuongMotTrang;
    const sanPhamDangHien = sanPhamDaSapXep.slice(viTriBatDau, viTriBatDau + soLuongMotTrang);
    const danhSachTrang = Array.from({ length: tinhSoTrang }, (_, i) => i + 1);

    // Hiển thị sao theo điểm đánh giá trung bình thật (thay vì luôn 5 sao)
    const hienThiSao = (diem) => {
        const sao = [];
        for (let i = 1; i <= 5; i++) {
            sao.push(
                <i key={i} className={`bx ${i <= Math.round(diem || 0) ? "bxs-star" : "bx-star"}`}></i>
            );
        }
        return sao;
    };

    const dinhDangTien = (soTien) => `${(Number(soTien) || 0).toLocaleString("vi-VN")}đ`;

    return (
        <div className="chitiethangsp">
            {/* THANH BACK */}
            <div className="chitconsiethangsp-back">
                <ul className="chitconsiethangsp-back-list">
                    <li>
                        <Link to="/home">Trang chủ</Link>
                        <i className="bx bx-chevron-right"></i>
                    </li>

                    <li className="chitconsiethangsp-back-list-th">{thuongHieuHienTai ? thuongHieuHienTai.tenThuongHieu : tenHang}</li>
                </ul>
            </div>

            {/* KHU VỰC BỘ LỌC */}
            <div className="chitiethangsp-filter-wrap">
                <div className="chitiethangsp-filter-toggle-wrap">
                    <button className="chitiethangsp-filter-toggle"
                        onClick={() => setHienThiBoLoc(!hienThiBoLoc)}
                    >
                        BỘ LỌC TÌM KIẾM
                        <i className="bx bx-filter-alt"></i>
                        {soBoLocDangChon > 0 && (
                            <span className="chitiethangsp-filter_badge">{soBoLocDangChon}</span>
                        )}
                    </button>
                </div>

                <div className="chitiethangsp-filter">
                    {hienThiBoLoc && (
                        <>
                            <div className="chitiethangsp-filter_group">
                                <span className="chitiethangsp-filter_label">Hãng sản xuất:</span>
                                <div className="chitiethangsp-filter_options">
                                    {danhSachThuongHieu.map((th) => (
                                        <button
                                            key={th.maThuongHieu}
                                            className={`chitiethangsp-filter_btn ${cungHang(giaTriHang(th), tenHang) ? "active" : ""}`}
                                            onClick={() => navigate(`/home/hang/${encodeURIComponent(giaTriHang(th))}`)}
                                        >
                                            {th.tenThuongHieu}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="chitiethangsp-filter_group">
                                <span className="chitiethangsp-filter_label">Dung lượng RAM:</span>
                                <div className="chitiethangsp-filter_options">
                                    {DS_RAM.map((muc) => (
                                        <button
                                            key={muc}
                                            className={`chitiethangsp-filter_btn ${ramDaChon.includes(muc) ? "active" : ""}`}
                                            onClick={() => chonLoc("ram", muc)}
                                            disabled={demTheoMuc("_ram", muc) === 0}
                                            title={demTheoMuc("_ram", muc) === 0 ? "Không có sản phẩm" : `${demTheoMuc("_ram", muc)} sản phẩm`}
                                        >
                                            {muc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="chitiethangsp-filter_group">
                                <span className="chitiethangsp-filter_label">Bộ nhớ trong ROM:</span>
                                <div className="chitiethangsp-filter_options">
                                    {DS_ROM.map((muc) => (
                                        <button
                                            key={muc}
                                            className={`chitiethangsp-filter_btn ${romDaChon.includes(muc) ? "active" : ""}`}
                                            onClick={() => chonLoc("rom", muc)}
                                            disabled={demTheoMuc("_rom", muc) === 0}
                                            title={demTheoMuc("_rom", muc) === 0 ? "Không có sản phẩm" : `${demTheoMuc("_rom", muc)} sản phẩm`}
                                        >
                                            {muc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {soBoLocDangChon > 0 && (
                                <button className="chitiethangsp-filter_clear" onClick={xoaBoLoc}>
                                    <i className="bx bx-x"></i> Xóa bộ lọc
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>



            {/* THANH TOOLBAR: SỐ LƯỢNG + SẮP XẾP */}
            <div className="chitiethangsp-toolbar">
                <div className="chitiethangsp-toolbar_count">
                    Tìm thấy <span>{sanPhamDaLoc.length}</span> sản phẩm phù hợp
                </div>
                <ul className="chitiethangsp-toolbar_sort">
                    <li className="chitiethangsp-toolbar_sort-label">Sắp xếp theo:</li>
                    <li>
                        <button
                            className={`chitiethangsp-sort_btn ${kieuSapXep === "ban-chay" ? "active" : ""}`}
                            onClick={() => setKieuSapXep("ban-chay")}
                        >
                            Bán chạy nhất
                        </button>
                    </li>
                    <li>
                        <button
                            className={`chitiethangsp-sort_btn ${kieuSapXep === "gia-tang" ? "active" : ""}`}
                            onClick={() => setKieuSapXep("gia-tang")}
                        >
                            Giá thấp đến cao
                        </button>
                    </li>
                    <li>
                        <button
                            className={`chitiethangsp-sort_btn ${kieuSapXep === "gia-giam" ? "active" : ""}`}
                            onClick={() => setKieuSapXep("gia-giam")}
                        >
                            Giá cao đến thấp
                        </button>
                    </li>
                    <li>
                        <button
                            className={`chitiethangsp-sort_btn ${kieuSapXep === "moi-ve" ? "active" : ""}`}
                            onClick={() => setKieuSapXep("moi-ve")}
                        >
                            Hàng mới về
                        </button>
                    </li>
                </ul>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <div className="chitiethangsp-list">
                {dangTai ? (
                    <p className="chitiethangsp-trang-thai">Đang tải sản phẩm...</p>
                ) : sanPhamDangHien.length === 0 ? (
                    <p className="chitiethangsp-trang-thai">
                        {soBoLocDangChon > 0
                            ? "Không có sản phẩm nào phù hợp với bộ lọc đã chọn."
                            : "Không có sản phẩm nào thuộc thương hiệu này."}
                    </p>
                ) : (
                    <ul className="chitiethangsp-grid">
                        {sanPhamDangHien.map((product) => (
                            <li className="chitiethangsp-card" key={product.maSP}>
                                <div className="chitiethangsp-card_imgwrap" style={{ position: 'relative' }}>
                                    <i
                                        className={`bx ${danhSachTym.includes(product.maSP) ? 'bxs-heart' : 'bx-heart'}`}
                                        onClick={() => xuLyTym(product.maSP)}
                                        style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, fontSize: '22px', cursor: 'pointer', color: danhSachTym.includes(product.maSP) ? 'red' : '#1D4ED8' }}
                                    />
                                    {product.badge && <span className="chitiethangsp-badge">{product.badge}</span>}
                                    <img
                                        src={layUrlAnh(product.hinhAnh)}
                                        alt={product.tenSP}
                                    />
                                </div>

                                {/* Luôn render khung chứa tag để giữ chiều cao cố định,
                                    tránh card không có tag bị lệch so với card có tag */}
                                <span className="chitiethangsp-card_tag-slot">
                                    {product.tag && <span className="chitiethangsp-card_tag">{product.tag}</span>}
                                </span>

                                <h3 className="chitiethangsp-card_name">{product.tenSP}</h3>

                                <div className="chitiethangsp-card_price">
                                    <span className="price-new">{dinhDangTien(product.giaBan)}</span>
                                </div>

                                <div className="chitiethangsp-card_rating">
                                    {hienThiSao(product.diemDanhGiaTB)}
                                    <span>({product.soLuongDanhGia || 0} đánh giá)</span>
                                </div>

                                <Link to={`/home/hang/chi-tiet-san-pham/${product.maSP}`} className="chitiethangsp-card_btn">
                                    Xem chi tiết
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* PHÂN TRANG */}
            {tinhSoTrang > 1 && (
                <div className="chitiethangsp-pagination">
                    <button
                        className="chitiethangsp-page_btn"
                        onClick={() => setTrangHienTai(trangHienTai - 1)}
                        disabled={trangHienTai === 1}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>

                    {danhSachTrang.map((soTrang) => (
                        <button
                            key={soTrang}
                            className={`chitiethangsp-page_btn ${trangHienTai === soTrang ? "active" : ""}`}
                            onClick={() => setTrangHienTai(soTrang)}
                        >
                            {soTrang}
                        </button>
                    ))}

                    <button
                        className="chitiethangsp-page_btn"
                        onClick={() => setTrangHienTai(trangHienTai + 1)}
                        disabled={trangHienTai >= tinhSoTrang}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                </div>
            )}

        </div>
    );
}
export default SanPhamCacHang;
