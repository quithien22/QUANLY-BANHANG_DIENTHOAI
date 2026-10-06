import React, { useState, useEffect } from "react";
import "./chitietsanpham.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import DanhGiaSanPhamSection from '../danhgia_page/danhgia';

function ChiTietSanPham() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sanPham, setSanPham] = useState(null);
    const [dangTai, setDangTai] = useState(true);
    const [khongTimThay, setKhongTimThay] = useState(false);

    const [dungLuongChon, setDungLuongChon] = useState(null);
    const [mauSacChon, setMauSacChon] = useState(null);

    const [hinhAnhHienThi, setHinhAnhHienThi] = useState("");
    const [danhSachAnh, setDanhSachAnh] = useState([]);
    // 2. GỌI API TẢI CHI TIẾT SẢN PHẨM
  useEffect(() => {
        if (!id) return;

        setDangTai(true);
        setKhongTimThay(false);

        axios.get(`http://localhost:8080/api/sanpham/chitiet/${id}`)
            .then((response) => {
                const sp = response.data;
                setSanPham(sp);
                setDungLuongChon(sp.bienTheDungLuong?.[0] || null);
                setMauSacChon(sp.bienTheMauSac?.[0] || null);

                // TẠO DANH SÁCH ẢNH: Gộp ảnh chính, ảnh phụ (nếu có) và ảnh của biến thể màu sắc
                const anhChinh = sp.hinhAnh;
                const anhPhu = sp.danhSachAnhPhu || []; // Lấy từ Backend (nếu bạn đã thêm)
                const anhMauSac = (sp.bienTheMauSac || []).map(m => m.hinhAnh).filter(Boolean);
                
                // Lọc trùng lặp để mảng ảnh đẹp nhất
                const mangAnhGop = [...new Set([anhChinh, ...anhPhu, ...anhMauSac])].filter(Boolean);
                
                setDanhSachAnh(mangAnhGop);
                setHinhAnhHienThi(anhChinh); // Mặc định chiếu ảnh chính lên trước
            })
            .catch((error) => {
                console.error("Lỗi khi tải chi tiết sản phẩm:", error);
                setKhongTimThay(true);
            })
            .finally(() => setDangTai(false));
    }, [id]);

    // TỰ ĐỘNG ĐỔI ẢNH KHI KHÁCH CHỌN MÀU SẮC MỚI
    useEffect(() => {
        if (mauSacChon && mauSacChon.hinhAnh) {
            setHinhAnhHienThi(mauSacChon.hinhAnh);
        }
    }, [mauSacChon]);

    if (dangTai) return <p className="chitietsp-error">Đang tải sản phẩm...</p>;
    if (khongTimThay || !sanPham) return <p className="chitietsp-error">Không tìm thấy sản phẩm này.</p>;

    // ============== HÀM TIỆN ÍCH ===========
    const layUrlAnh = (duongDan) => {
        if (!duongDan) return "";
        return duongDan.startsWith("http") ? duongDan : `http://localhost:8080${duongDan}`;
    };
    const dinhDangTien = (soTien) => `${(Number(soTien) || 0).toLocaleString("vi-VN")}đ`;

    const giaGiaCoBan = (sanPham.giaFlashSale && Number(sanPham.giaFlashSale) > 0)
        ? Number(sanPham.giaFlashSale)
        : Number(sanPham.giaBan);

    const giaHienTai = (Number(giaGiaCoBan) || 0)
        + (Number(dungLuongChon?.giaChenhLech) || 0)
        + (Number(mauSacChon?.giaChenhLech) || 0);

    const dangBan = sanPham.trangThai === true || sanPham.trangThai === 1;
    const conHang = Number(sanPham.tonKho) > 0;
    const coTheMua = dangBan && conHang;
    const nhanKhongMua = !dangBan ? "NGỪNG KINH DOANH" : "HẾT HÀNG";

    // ============== THÊM VÀO GIỎ HÀNG ===========
    const themVaoGio = async () => {
        const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");

        if (!nguoiDung?.maKH) {
            const ketQua = await Swal.fire({
                title: "Bạn cần đăng nhập",
                text: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Đăng nhập",
                cancelButtonText: "Để sau",
            });
            if (ketQua.isConfirmed) navigate("/login");
            return false;
        }

        if (sanPham.bienTheDungLuong?.length > 0 && !dungLuongChon) {
            Swal.fire("Thiếu thông tin", "Vui lòng chọn Dung lượng!", "warning");
            return false;
        }
        if (sanPham.bienTheMauSac?.length > 0 && !mauSacChon) {
            Swal.fire("Thiếu thông tin", "Vui lòng chọn Màu sắc!", "warning");
            return false;
        }

        const thongTinPhanLoai = [dungLuongChon?.giaTri, mauSacChon?.giaTri].filter(Boolean).join(" - ");

        try {
            await axios.post("http://localhost:8080/api/giohang/them", {
                maKH: nguoiDung.maKH,
                maSP: sanPham.maSP,
                maBienThe: dungLuongChon?.maBienThe || mauSacChon?.maBienThe || null,
                tenPhanLoai: thongTinPhanLoai,
                giaTaiThoiDiemThem: giaHienTai,
                soLuong: 1,
            });

            window.dispatchEvent(new Event("gioHangCapNhat"));
            return true;
        } catch (error) {
            console.error("Lỗi khi thêm vào giỏ hàng:", error);
            Swal.fire("Lỗi!", "Không thể thêm vào giỏ hàng, vui lòng thử lại.", "error");
            return false;
        }
    };

    const xuLyThemGioHang = async () => {
        const thanhCong = await themVaoGio();
        if (!thanhCong) return;

        const ketQua = await Swal.fire({
            title: "Đã thêm vào giỏ hàng!",
            icon: "success",
            showCancelButton: true,
            confirmButtonText: "Xem giỏ hàng",
            cancelButtonText: "Tiếp tục mua sắm",
        });
        if (ketQua.isConfirmed) navigate("/themgiohang");
    };

    const xuLyMuaNgay = async () => {
        const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");

        if (!nguoiDung?.maKH) {
            const ketQua = await Swal.fire({
                title: "Bạn cần đăng nhập",
                text: "Vui lòng đăng nhập để tiến hành mua ngay.",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Đăng nhập",
                cancelButtonText: "Để sau",
            });
            if (ketQua.isConfirmed) navigate("/login");
            return;
        }

        if (sanPham.bienTheDungLuong?.length > 0 && !dungLuongChon) {
            Swal.fire("Thiếu thông tin", "Vui lòng chọn Dung lượng!", "warning"); return;
        }
        if (sanPham.bienTheMauSac?.length > 0 && !mauSacChon) {
            Swal.fire("Thiếu thông tin", "Vui lòng chọn Màu sắc!", "warning"); return;
        }

        const thongTinPhanLoai = [dungLuongChon?.giaTri, mauSacChon?.giaTri].filter(Boolean).join(" - ");

        const thongTinDonHang = {
            maSP: sanPham.maSP,
            tenSP: sanPham.tenSP,
            hinhAnh: hinhAnhHienThi, 
            tenPhanLoai: thongTinPhanLoai,
            maBienThe: dungLuongChon?.maBienThe || mauSacChon?.maBienThe || null,
            gia: giaHienTai,
            soLuong: 1,
            tongTien: giaHienTai
        };

        navigate("/tienhanhdathang", { state: { dsMuaNgay: [thongTinDonHang] } });
    };

    const xemTraGop = () => {
        Swal.fire({ title: "Trả góp 0%",
             html: "Hỗ trợ trả góp 0% qua thẻ tín dụng, xét duyệt nhanh.<br/>Liên hệ hotline <b>0981918724</b> để được tư vấn chi tiết.", 
             icon: "info" 
            });
    };

    const xemThuCuDoiMoi = () => {
        Swal.fire({ title: "Thu cũ đổi mới", 
            html: "Trợ giá thu mua lên tới 2.5 triệu đồng.<br/>Mang máy cũ đến cửa hàng hoặc liên hệ hotline <b>0981918724</b> để được định giá.", 
            icon: "info" 
        });
    };

    return (
        <div className="chitietsp-page">

            {/* THANH BREADCRUMB (ĐIỀU HƯỚNG) */}
            <div className="chitietsp-breadcrumb">
                <ul>
                    <li>
                        <Link to="/home">Trang chủ</Link>
                        <i className="bx bx-chevron-right"></i>
                    </li>
                    <li>
                        <span>{sanPham.tenLSP || "Sản phẩm"}</span>
                        <i className="bx bx-chevron-right"></i>
                    </li>
                    <li>
                        {sanPham.maThuongHieu ? (
                            <Link to={`/hang/${sanPham.maThuongHieu}`}>{sanPham.tenThuongHieu}</Link>
                        ) : (
                            sanPham.tenThuongHieu
                        )}
                    </li>
                </ul>
            </div>

            {/* TIÊU ĐỀ VÀ ĐÁNH GIÁ */}
            <div className="chitietsp-header">
                <ul>
                    <li className="chitietsp-header-name">{sanPham.tenSP}</li>
                    <a href="#khu-vuc-danh-gia" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <li className="chitietsp-header-rating">
                            <i className="bx bxs-star"></i>
                            <span className="rating-score">{Number(sanPham.diemDanhGiaTB || 0).toFixed(1)}</span>
                            <span className="rating-count">({sanPham.soLuongDanhGia || 0} đánh giá)</span>
                        </li>
                    </a>
                </ul>
            </div>

           <div className="chitietsp-main">
                {/* CỘT TRÁI: ẢNH SẢN PHẨM VÀ THUMBNAILS */}
                <div className="chitietsp-gallery">
                    <div className="main-image-box">
                        <img src={layUrlAnh(hinhAnhHienThi)} alt={sanPham.tenSP} className="chitietsp-gallery-img" />
                    </div>

                    {/* HIỂN THỊ DANH SÁCH ẢNH NHỎ BÊN DƯỚI NẾU CÓ > 1 ẢNH */}
                    {danhSachAnh.length > 1 && (
                        <div className="thumbnail-list">
                            {danhSachAnh.map((imgUrl, index) => (
                                <div 
                                    key={index} 
                                    className={`thumbnail-item ${hinhAnhHienThi === imgUrl ? "active" : ""}`}
                                    onClick={() => setHinhAnhHienThi(imgUrl)}
                                >
                                    <img src={layUrlAnh(imgUrl)} alt={`${sanPham.tenSP} - ${index}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cột phải: Chi tiết và Nút mua */}
                <div className="chitietsp-details">
                    <ul className="chitietsp-details-list">

                        {/* Giá + tình trạng kho */}
                        <li className="chitietsp-price-box">
                            <span className="chitietsp-price">{dinhDangTien(giaHienTai)}</span>
                            {!dangBan ? (
                                <span className="chitietsp-stock stock-out">Ngừng kinh doanh</span>
                            ) : !conHang ? (
                                <span className="chitietsp-stock stock-out">Hết hàng</span>
                            ) : Number(sanPham.tonKho) <= 5 ? (
                                <span className="chitietsp-stock stock-low">Chỉ còn {sanPham.tonKho} sản phẩm</span>
                            ) : (
                                <span className="chitietsp-stock stock-ok">Còn hàng</span>
                            )}
                        </li>

                        {/* Box dung lượng   */}
                        {sanPham.bienTheDungLuong?.length > 0 && (
                            <li className="chitietsp-option-group chitietsp-storage">
                                <span className="chitietsp-option-title">CHỌN DUNG LƯỢNG:</span>
                                <div className="chitietsp-option-buttons">
                                    {sanPham.bienTheDungLuong.map((item) => (
                                        <button
                                            key={item.maBienThe}
                                            className={`btn-storage btn-boder ${dungLuongChon?.maBienThe === item.maBienThe ? "active" : ""}`}
                                            onClick={() => setDungLuongChon(item)}
                                        >
                                            <span className="storage-ram">{item.giaTri}</span>
                                            <span className="storage-price">
                                                {dinhDangTien((Number(sanPham.giaBan) || 0) + (Number(item.giaChenhLech) || 0))}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </li>
                        )}

                        {/* Box màu sắc   */}
                        {sanPham.bienTheMauSac?.length > 0 && (
                            <li className="chitietsp-option-group chitietsp-color">
                                <span className="chitietsp-option-title">CHỌN MÀU SẮC</span>
                                <div className="chitietsp-option-buttons">
                                    {sanPham.bienTheMauSac.map((item) => (
                                        <button
                                            key={item.maBienThe}
                                            className={`btn-color btn-boder ${mauSacChon?.maBienThe === item.maBienThe ? "active" : ""}`}
                                            onClick={() => setMauSacChon(item)}
                                        >
                                            <span className="color-name">{item.giaTri}</span>
                                            {item.hinhAnh && (
                                                <img src={layUrlAnh(item.hinhAnh)} alt={item.giaTri} className="color-img" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </li>
                        )}

                        {/* Box khuyến mãi  */}
                        <li className="chitietsp-promo-box">
                            <span className="promo-title">
                                <i className="bx bx-gift" />
                                KHUYẾN MÃI ĐI KÈM CỰC KHỦNG</span>
                            <ul className="promo-list">
                                <li>1. Nhận voucher mua phụ kiện trị giá 1.000.000đ.</li>
                                <li>2. Giảm ngay 1 triệu đồng khi mua kèm Gói bảo hành VIP 12 tháng.</li>
                                <li>3. Trả góp siêu ưu đãi qua thẻ tín dụng lãi suất 0%.</li>
                            </ul>
                        </li>

                        {/* Nút hành động chính */}
                        <li className="chitietsp-actions">
                            <button
                                className="btn-action btn-buy-now"
                                onClick={xuLyMuaNgay}
                                disabled={!coTheMua}
                            >
                                {coTheMua ? "MUA NGAY" : nhanKhongMua}
                            </button>
                            <button
                                className="btn-action btn-add-cart"
                                onClick={xuLyThemGioHang}
                                disabled={!coTheMua}
                            >
                                <i className="bx bx-cart-alt" />
                                <span>Thêm giỏ hàng</span>
                            </button>
                        </li>

                        {/* Nút hành động phụ */}
                        <li className="chitietsp-extra-actions">
                            <button className="btn-extra btn-installment" onClick={xemTraGop}>
                                <span className="extra-title">TRẢ GÓP 0%</span>
                                <span className="extra-desc">Qua thẻ tín dụng, xét duyệt nhanh</span>
                            </button>
                            <button className="btn-extra btn-trade-in" onClick={xemThuCuDoiMoi}>
                                <span className="extra-title">THU CŨ ĐỔI MỚI</span>
                                <span className="extra-desc">Trợ giá thu mua lên tới 2.5 triệu</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* THÔNG SỐ KỸ THUẬT */}
            <div className="chitietsp-specs">
                <span className="chitietsp-specs-title">THÔNG SỐ KỸ THUẬT CHI TIẾT</span>
                <ul className="chitietsp-specs-list">
                    {sanPham.thongSoKyThuat?.length > 0 ? (
                        sanPham.thongSoKyThuat.map((item, i) => (
                            <li key={i} className="specs-item">
                                <span className="specs-label">{item.nhan}:</span>
                                <span className="specs-value"> {item.giaTri}</span>
                            </li>
                        ))
                    ) : (
                        <li className="specs-item">Chưa có thông số kỹ thuật cho sản phẩm này.</li>
                    )}
                </ul>
            </div>

            {/* SẢN PHẨM TƯƠNG TỰ */}
            <div className="sanphamtuongtu">
                {/* Nội dung sản phẩm tương tự sẽ viết ở đây */}
            </div>

            {/* ĐÁNH GIÁ SẢN PHẨM */}
            <DanhGiaSanPhamSection
                productId={sanPham.maSP}
                avgRating={sanPham.diemDanhGiaTB}
                totalReviews={sanPham.soLuongDanhGia}
            />

        </div>
    );
}

export default ChiTietSanPham;