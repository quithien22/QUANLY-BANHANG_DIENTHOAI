import React, { useState, useEffect } from "react";
import "./FlashSale.css";
import { Link } from "react-router-dom";
import { promotionApi } from "../../../API/PromotionApi";

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
                <span className="flashsale-badge">{product.badge}</span>
                <img src={product.hinhAnh}  />
              </div>
              <span className="flashsale-card_tag">{product.tag}</span>
              <h3 className="flashsale-card_name">{product.tenSP}</h3>
              <div className="flashsale-card_price">
                <span className="price-new">{product.giaFlashSale}</span>
                <span className="price-old">{product.giaBan}</span>
              </div>
              <div className="flashsale-card_rating">
                <span>{product.diemDanhGiaTB}</span>
                <i className="bx bxs-star"></i>
                <span>({product.soLuongDanhGia} đánh giá)</span>
              </div>
              <Link to={`/chi-tiet-san-pham/${product.maSP}`}>
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