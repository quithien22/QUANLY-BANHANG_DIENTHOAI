import React, { useState, useEffect } from "react";
import axios from "axios";
import './banner.css';

function Banner() {
  // 1. Khai báo state lưu danh sách banner lấy từ server
  const [bannerSlides, setBannerSlides] = useState([]);
  const [bannerPhuTruoc, setBannerPhuTruoc] = useState(null);
  const [bannerPhuSau, setBannerPhuSau] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 2. Gọi API lấy dữ liệu banner khi component được load
  useEffect(() => {
    axios.get("http://localhost:8080/api/caidat/banner")
      .then(res => {
        // Lọc chỉ lấy những banner đang bật (trangThai === 1 hoặc true)
        const activeBanners = res.data.filter(b => b.trangThai === 1 || b.trangThai === true);

        // Phân loại theo vị trí mà bạn đã thiết kế trong CSDL
        const sliderList = activeBanners.filter(b => b.viTri === 'slider_chinh');
        const phuTren = activeBanners.find(b => b.viTri === 'phu_tren');
        const phuDuoi = activeBanners.find(b => b.viTri === 'phu_duoi');

        setBannerSlides(sliderList);
        setBannerPhuTruoc(phuTren);
        setBannerPhuSau(phuDuoi);
      })
      .catch(err => console.error("Lỗi khi tải banner từ server:", err));
  }, []);

  // 3. Hàm chuyển slide qua lại
  const goToPrev = () => {
    if (bannerSlides.length === 0) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? bannerSlides.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    if (bannerSlides.length === 0) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === bannerSlides.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Nếu dữ liệu chưa về kịp thì hiển thị khung trống hoặc dòng chữ loading
  if (bannerSlides.length === 0) {
    return <div className="banner">Đang tải banner...</div>;
  }

  const currentSlide = bannerSlides[currentIndex];

  return (
    <div className="banner">
      {/* SLIDER CHÍNH BÊN TRÁI */}
      <div className="banner-left">
        {/* Dùng thẻ img trực tiếp để hiển thị đúng hình ảnh từ CSDL */}
        <img src={currentSlide.hinhAnh}  className="banner-img-main" />

        <div className="banner-content">
          <span className="banner-tag">{currentSlide.tenBanner}</span>
          <h2 className="banner-title">{currentSlide.tieuDe}</h2>
          <p className="banner-desc">{currentSlide.moTa}</p>
          <div className="banner-buttons">
            <a href={currentSlide.duongDan} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
              {currentSlide.textNutBam || "Nhận ưu đãi ngay"}
            </a>
            <button className="btn-outline">Chi tiết chương trình</button>
          </div>
        </div>

        {/* Nút điều hướng */}
        <button className="banner-nav banner-nav-prev" onClick={goToPrev}>
          <i className="bx bx-chevron-left"></i>
        </button>
        <button className="banner-nav banner-nav-next" onClick={goToNext}>
          <i className="bx bx-chevron-right"></i>
        </button>

        {/* Chấm chỉ vị trí */}
        <div className="banner-dots">
          {bannerSlides.map((_, index) => (
            <span
              key5={index}
              className={`dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      </div>

      {/* 5. BANNER PHỤ BÊN PHẢI (Lấy động từ CSDL vị trí phu_tren và phu_duoi) */}
      <div className="banner_right">
        <div className="banner_right_item banner_right_top">
          {bannerPhuTruoc && (
            <a href={bannerPhuTruoc.duongDan}>
              <img src={bannerPhuTruoc.hinhAnh} alt={bannerPhuTruoc.tenBanner} />
            </a>
          )}
        </div>
        <div className="banner_right_item banner_right_bottom">
          {bannerPhuSau && (
            <a href={bannerPhuSau.duongDan}>
              <img src={bannerPhuSau.hinhAnh} alt={bannerPhuSau.tenBanner} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Banner;