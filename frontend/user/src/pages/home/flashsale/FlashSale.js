import React, { useState, useEffect } from "react";
import "./FlashSale.css";
import { Link } from "react-router-dom";
import { promotionApi } from "../../../API/PromotionApi";
import { layUrlAnh } from "../../../utils/imageUrl";

function FlashSaleGioVang() {
     const [danhSachKhuyenMai, setDanhSachKhuyenMai] = useState([]);

    const taiLaiDanhSachKhuyenMai = () => {
        promotionApi.getFlashSale()
            .then((data) => {
                const duLieu = Array.isArray(data)
                    ? data
                    : data?.data || data?.content || data?.items || [];
                setDanhSachKhuyenMai(Array.isArray(duLieu) ? duLieu : []);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiLaiDanhSachKhuyenMai();
    }, []);

    // ======== ĐẾM NGƯỢC KHUNG GIỜ ĐANG DIỄN RA ========
    const [thoiGianConLai, setThoiGianConLai] = useState("00 : 00 : 00");

    // Khung giờ đang diễn ra (lấy từ sản phẩm flash sale) → giờ kết thúc
    const gioKetThuc = danhSachKhuyenMai.find(
        (sp) => sp.trangThaiThucTe === "Đang diễn ra"
    )?.gioKT;

    useEffect(() => {
        if (!gioKetThuc) return;

        const timeMatch = String(gioKetThuc).match(/(\d{2}):(\d{2})/);
        if (!timeMatch) return;

        const tick = () => {
            const thoiGianKT = new Date();
            thoiGianKT.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
            const distance = thoiGianKT - new Date();

            if (distance <= 0) {
                setThoiGianConLai("00 : 00 : 00");
                return;
            }
            const h = String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, '0');
            const m = String(Math.floor((distance / 1000 / 60) % 60)).padStart(2, '0');
            const s = String(Math.floor((distance / 1000) % 60)).padStart(2, '0');
            setThoiGianConLai(`${h} : ${m} : ${s}`);
        };

        tick(); // cập nhật ngay, không chờ 1 giây đầu
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [gioKetThuc]);
 

  // LẶP QUA SẢN PHẨM KHÁC
  const soLuongHienThi = 4;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Vị trí cuối cùng được phép trượt tới
  const maxIndex = Math.max(0, danhSachKhuyenMai.length - soLuongHienThi);

  const goToPrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? maxIndex : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === maxIndex ? 0 : prevIndex + 1
    );
  };

  const currentSlide = danhSachKhuyenMai.slice(currentIndex, currentIndex + soLuongHienThi);
  if (!danhSachKhuyenMai || danhSachKhuyenMai.length === 0) {
      return null;
  }
  return (
    <div className="flashsale">
      <div className="flashsale_title">
        <ul>
          <li>
            <i className="bx bx-bolt-alt" />
            <span>GIỜ VÀNG CỰC SỐC</span>
            {gioKetThuc && (
              <div className="flashsale-countdown">
                <span className="flashsale-countdown_label">Kết thúc trong:</span>
                <span className="flashsale-countdown_timer">{thoiGianConLai}</span>
              </div>
            )}
          </li>
          <li>
            <Link to="/home/san-pham-khuyen-mai" href="#" className="flashsale-viewall">Xem tất cả khuyến mãi</Link>
          </li>
        </ul>
      </div>

      <div className="flashsale-list">

        {/* Nút lùi */}
        <button className="flashsale-nav flashsale-nav-prev" onClick={goToPrev}>
          <i className="bx bx-chevron-left"></i>
        </button>

        <ul>
          {currentSlide.map((product, index) => (
            <li className="flashsale-card" key={index}>
              <div className="flashsale-card_imgwrap">
                {product.badge && <span className="flashsale-badge">{product.badge}</span>}
                <img src={layUrlAnh(product.hinhAnh)} alt={product.tenSP} />
              </div>
              <div className="flashsale-card_tagwrap">
                {product.tag && <span className="flashsale-card_tag">{product.tag}</span>}
              </div>
              <h3 className="flashsale-card_name">{product.tenSP}</h3>
              <div className="flashsale-card_price">
                <span className="price-new">
                  {product.giaFlashSale ? product.giaFlashSale.toLocaleString('vi-VN') : 0}đ
                </span>
                <span className="price-old">
                  {product.giaBan ? product.giaBan.toLocaleString('vi-VN') : 0}đ
                </span>
              </div>
              <div className="flashsale-card_rating">
                <span>{product.diemDanhGiaTB}</span>
                <i className="bx bxs-star"></i>
                <span>({product.soLuongDanhGia} đánh giá)</span>
              </div>
              <Link to={`/home/hang/chi-tiet-san-pham/${product.maSP}`} className="flashsale-card_link">
                <button className="flashsale-card_btn">Xem chi tiết</button>
              </Link>
              
            </li>
          ))}
        </ul>

        {/* Nút tiến */}
        <button className="flashsale-nav flashsale-nav-next" onClick={goToNext}>
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

export default FlashSaleGioVang;