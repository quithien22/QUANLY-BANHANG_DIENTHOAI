import React, { useState, useEffect } from "react";
import "./sanphamdienthoai.css";
import axios from "axios";
import { Link } from "react-router-dom";


function DanhSachSanPhamTheoLoai({ tieuDe, maLSP }) {

    // STATE LƯU TRỮ DỮ LIỆU TỪ DATABASE
    const [danhSachSP, setDanhSachSP] = useState([]);

    // STATE LƯU CÁC SẢN PHẨM ĐÃ ĐƯỢC THẢ TIM
    const [danhSachTym, setDanhSachTym] = useState([]);

    // LẤY THÔNG TIN KHÁCH HÀNG TỪ LOCAL STORAGE
    const nguoiDung = JSON.parse(localStorage.getItem("userData") || "null");
    const maKH = nguoiDung?.maKH;

    //  GỌI API DỰA TRÊN maLSP
    useEffect(() => {
        if (!maLSP) return;

        axios.get(`http://localhost:8080/api/sanpham/loai-san-pham/${maLSP}`)
            .then((response) => {
                const duLieu = Array.isArray(response.data)
                    ? response.data
                    : response.data?.data || response.data?.content || response.data?.items || [];
                setDanhSachSP(Array.isArray(duLieu) ? duLieu : []);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    }, [maLSP]);

    // GỌI API LẤY DANH SÁCH TIM BAN ĐẦU CỦA USER
    useEffect(() => {
        if (maKH) {
            axios.get(`http://localhost:8080/api/yeuthich/${maKH}`)
                .then((response) => {
                    // Chỉ lấy mảng mã SP để dễ so sánh (VD: ['SP01', 'SP05'])
                    const mangMaSP = response.data.map(sp => sp.maSP);
                    setDanhSachTym(mangMaSP);
                })
                .catch(err => console.error("Lỗi tải danh sách tim:", err));
        }
    }, [maKH]);

    // HÀM XỬ LÝ KHI BẤM VÀO TRÁI TIM
    const xuLyTym = async (maSP) => {
        if (!maKH) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào mục Yêu thích!");
            return;
        }

        try {
            const res = await axios.post("http://localhost:8080/api/yeuthich/toggle", { maKH, maSP });
            if (res.data.success) {
                if (res.data.action === 'added') {
                    setDanhSachTym(prev => [...prev, maSP]); // Thêm vào mảng local (Đỏ)
                } else {
                    setDanhSachTym(prev => prev.filter(id => id !== maSP)); // Xóa khỏi mảng local (Rỗng)
                }
            }
        } catch (error) {
            console.error("Lỗi khi thả tim:", error);
        }
    };

    //  LOGIC TRƯỢT SẢN PHẨM  
    const soLuongHienThiSP = 8;
    const [viTriHienTai, setVitriHienTai] = useState(0);

    // Tính toán dựa trên độ dài của mảng dữ liệu lấy từ Database
    const viTriTruot = Math.max(0, danhSachSP.length - soLuongHienThiSP);

    const nutTien = () => {
        setVitriHienTai((prevIndex) =>
            prevIndex >= viTriTruot ? viTriTruot : prevIndex + 1
        );
    };

    const nutLui = () => {
        setVitriHienTai((prevIndex) =>
            prevIndex <= 0 ? 0 : prevIndex - 1
        );
    };

    const viTriHienThi = danhSachSP.slice(viTriHienTai, viTriHienTai + soLuongHienThiSP);

    return (
        <div className="spdienthoai">
            <div className="spdienthoai_title">
                <ul>
                    <li>
                        {/* Render Tiêu đề tự động (Điện thoại / Tablet...) */}
                        <span>{tieuDe}</span>
                    </li>
                    <li>
                        <Link to={`/home/danh-muc/${maLSP}`} className="spdienthoai-viewall">Xem tất cả</Link>
                    </li>
                </ul>
            </div>

            <div className="spdienthoai-list">

                {/* NÚT LÙI: Chỉ hiển thị nút bấm nếu tổng số SP lớn hơn 8 */}
                {viTriTruot > 0 && (
                    <button
                        className="spdienthoai-nav spdienthoai-nav-prev"
                        onClick={nutLui}
                        disabled={viTriHienTai === 0}
                    >
                        <i className="bx bx-chevron-left"></i>
                    </button>
                )}

                <ul>
                    {/* Render mảng đã được phân trang slider */}
                    {viTriHienThi.map((product, index) => {

                        const daTym = danhSachTym.includes(product.maSP);
                        return (
                            <li className="spdienthoai-card" key={product.maSP || index}>
                                <div className="spdienthoai-card_imgwrap">
                                    {/* ICON TIM ĐƯỢC GẮN SỰ KIỆN VÀ ĐỔI MÀU TỰ ĐỘNG */}
                                    <i
                                        className={`spdienthoai-hear bx ${daTym ? 'bxs-heart' : 'bx-heart'}`}
                                        onClick={() => xuLyTym(product.maSP)}
                                        style={{ color: daTym ? 'red' : 'inherit', cursor: 'pointer' }}
                                    />

                                    {product.badge && <span className="spdienthoai-badge">{product.badge}</span>}
                                    <img src={product.hinhAnh?.startsWith('http') ? product.hinhAnh : `http://localhost:8080${product.hinhAnh}`} alt={product.tenSP} />
                                </div>

                                {/* Luôn render khung chứa tag (kể cả rỗng) để giữ đúng chiều cao,
                                tránh các card không có tag bị đẩy nội dung lên trên so với
                                các card có tag -> đây là nguyên nhân gây "nhảy" layout */}
                                <span className="spdienthoai-card_tag-slot">
                                    {product.tag && <span className="spdienthoai-card_tag">{product.tag}</span>}
                                </span>

                                <h3 className="spdienthoai-card_name">{product.tenSP}</h3>

                                <div className="spdienthoai-card_price">
                                    {/* Format tiền tệ VNĐ */}
                                    <span className="price-new">
                                        {product.giaBan ? product.giaBan.toLocaleString('vi-VN') : 0}đ
                                    </span>
                                </div>

                                <div className="spdienthoai-card_rating">
                                    <span>{product.diemDanhGiaTB}</span>
                                    <i className="bx bxs-star"></i>
                                    <span>({product.soLuongDanhGia || 0} đánh giá)</span>
                                </div>

                                <Link to={`/chi-tiet-san-pham/${product.maSP}`}>
                                    <button className="spdienthoai-card_btn">Xem chi tiết</button>
                                </Link>

                            </li>
                        );
                    })}
                </ul>

                {/* NÚT TIẾN: Chỉ hiển thị nút bấm nếu tổng số SP lớn hơn 8 */}
                {viTriTruot > 0 && (
                    <button
                        className="spdienthoai-nav spdienthoai-nav-next"
                        onClick={nutTien}
                        disabled={viTriHienTai === viTriTruot}
                    >
                        <i className="bx bx-chevron-right"></i>
                    </button>
                )}
            </div>
        </div>
    );
}

export default DanhSachSanPhamTheoLoai;
