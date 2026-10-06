import React, { useState, useEffect } from "react";
import "./chitiethang.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function SanPhamCacHang() {

    // GHI CHÚ: đổi từ "tenHang" (tên hiển thị, VD "Apple") sang "maThuongHieu"
    // (mã, VD "TH01") vì bảng SanPham lọc theo mã, không theo tên. Route phía
    // React Router cũng cần đổi param tương ứng, VD: "/hang/:maThuongHieu"
    const { maThuongHieu } = useParams();
    const navigate = useNavigate();

    const [hienThiBoLoc, setHienThiBoLoc] = useState(false);

    // ============== DANH SÁCH THƯƠNG HIỆU (để render nút lọc "Hãng sản xuất") ===========
    const [danhSachThuongHieu, setDanhSachThuongHieu] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8080/api/thuonghieu")
            .then((response) => setDanhSachThuongHieu(response.data))
            .catch((error) => console.error("Lỗi khi lấy danh sách thương hiệu:", error));
    }, []);

    // Tên thương hiệu đang xem (để hiện lên breadcrumb), lấy từ danh sách vừa tải
    const thuongHieuHienTai = danhSachThuongHieu.find((th) => th.maThuongHieu === maThuongHieu);

    // ============== DANH SÁCH SẢN PHẨM THEO THƯƠNG HIỆU ===========
    const [sanPhamTheoHang, setSanPhamTheoHang] = useState([]);
    const [dangTai, setDangTai] = useState(true);

    useEffect(() => {
        if (!maThuongHieu) {

            console.warn("SanPhamCacHang: không nhận được maThuongHieu từ URL. Kiểm tra lại route và Link trỏ vào trang này.");
            setDangTai(false);
            setSanPhamTheoHang([]);
            return;
        }

        console.log("SanPhamCacHang: đang tải sản phẩm cho maThuongHieu =", maThuongHieu);
        setDangTai(true);
        axios.get(`http://localhost:8080/api/sanpham/thuonghieu/${maThuongHieu}`)
            .then((response) => {
                console.log("SanPhamCacHang: nhận được", response.data.length, "sản phẩm");
                setSanPhamTheoHang(response.data);
                setTrangHienTai(1);
            })
            .catch((error) => console.error("Lỗi khi lấy sản phẩm theo thương hiệu:", error))
            .finally(() => setDangTai(false));
    }, [maThuongHieu]);

    // ============== SẮP XẾP ===========
    // GIẢ ĐỊNH: "Bán chạy nhất" xếp theo soLuongDanhGia giảm dần (chưa có cột
    // "đã bán" thật trong schema); "Hàng mới về" xếp theo maSP giảm dần
    // (chưa có cột ngày tạo thật) - nên đổi lại khi bạn bổ sung các cột này.
    const [kieuSapXep, setKieuSapXep] = useState("ban-chay");

    const sanPhamDaSapXep = [...sanPhamTheoHang].sort((a, b) => {
        if (kieuSapXep === "gia-tang") return a.giaBan - b.giaBan;
        if (kieuSapXep === "gia-giam") return b.giaBan - a.giaBan;
        if (kieuSapXep === "moi-ve") return String(b.maSP).localeCompare(String(a.maSP));
        // mặc định: bán chạy nhất
        return (b.soLuongDanhGia || 0) - (a.soLuongDanhGia || 0);
    });

    // ============== PHÂN TRANG ===========
    const soLuongMotTrang = 8;
    const [trangHienTai, setTrangHienTai] = useState(1);

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

                    <li className="chitconsiethangsp-back-list-th">{thuongHieuHienTai ? thuongHieuHienTai.tenThuongHieu : maThuongHieu}</li>
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
                                            className={`chitiethangsp-filter_btn ${th.maThuongHieu === maThuongHieu ? "active" : ""}`}
                                            onClick={() => navigate(`/hang/${th.maThuongHieu}`)}
                                        >
                                            {th.tenThuongHieu}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* GHI CHÚ: 2 nhóm lọc dưới đây CHƯA lọc được sản phẩm thật,
                                vì schema hiện tại không có cột RAM, và ROM (BienTheSanPham)
                                chưa được nối vào câu truy vấn danh sách sản phẩm. Để mắt
                                lọc theo ROM hoạt động, cần join thêm BienTheSanPham theo
                                maSP + loaiBienThe='dungluong' và lọc theo giaTri. */}
                            <div className="chitiethangsp-filter_group">
                                <span className="chitiethangsp-filter_label">Dung lượng RAM:</span>
                                <div className="chitiethangsp-filter_options">
                                    <button className="chitiethangsp-filter_btn">4GB</button>
                                    <button className="chitiethangsp-filter_btn">6GB</button>
                                    <button className="chitiethangsp-filter_btn">8GB</button>
                                    <button className="chitiethangsp-filter_btn">12GB</button>
                                    <button className="chitiethangsp-filter_btn">16GB</button>
                                </div>
                            </div>

                            <div className="chitiethangsp-filter_group">
                                <span className="chitiethangsp-filter_label">Bộ nhớ trong ROM:</span>
                                <div className="chitiethangsp-filter_options">
                                    <button className="chitiethangsp-filter_btn">64GB</button>
                                    <button className="chitiethangsp-filter_btn">128GB</button>
                                    <button className="chitiethangsp-filter_btn">256GB</button>
                                    <button className="chitiethangsp-filter_btn">512GB</button>
                                    <button className="chitiethangsp-filter_btn">1TB</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>



            {/* THANH TOOLBAR: SỐ LƯỢNG + SẮP XẾP */}
            <div className="chitiethangsp-toolbar">
                <div className="chitiethangsp-toolbar_count">
                    Tìm thấy <span>{sanPhamTheoHang.length}</span> phù hợp
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
                    <p className="chitiethangsp-trang-thai">Không có sản phẩm nào thuộc thương hiệu này.</p>
                ) : (
                    <ul className="chitiethangsp-grid">
                        {sanPhamDangHien.map((product) => (
                            <li className="chitiethangsp-card" key={product.maSP}>
                                <div className="chitiethangsp-card_imgwrap">
                                    {product.badge && <span className="chitiethangsp-badge">{product.badge}</span>}
                                    <img
                                        src={product.hinhAnh?.startsWith('http') ? product.hinhAnh : `http://localhost:8080${product.hinhAnh}`}
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
                    disabled={trangHienTai === tinhSoTrang}
                >
                    <i className="bx bx-chevron-right"></i>
                </button>
            </div>

        </div>
    );
}
export default SanPhamCacHang;