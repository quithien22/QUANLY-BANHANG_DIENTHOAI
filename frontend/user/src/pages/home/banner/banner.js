import React, { useState, useEffect } from "react";
import { contentApi } from "../../../API/ContentApi";
import './banner.css';

const THOI_GIAN_TU_CHUYEN = 5000; // 5 giây đổi slide

function Banner() {
  const [bannerSlides, setBannerSlides] = useState([]);
  const [bannerPhuTruoc, setBannerPhuTruoc] = useState(null);
  const [bannerPhuSau, setBannerPhuSau] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dangTai, setDangTai] = useState(true);
  const [dangDung, setDangDung] = useState(false); // dừng tự chuyển khi rê chuột vào banner

  // 1. Lấy banner từ CSDL (admin thêm/sửa/tắt thì ngoài trang chủ tự đổi theo)
  useEffect(() => {
    contentApi.getBanners()
      .then(data => {
        // Chỉ lấy banner đang bật VÀ có ảnh (bỏ qua banner bị thiếu link ảnh)
        const activeBanners = data.filter(b => (b.trangThai === 1 || b.trangThai === true) && b.hinhAnh);

        setBannerSlides(activeBanners.filter(b => b.viTri === 'slider_chinh'));
        setBannerPhuTruoc(activeBanners.find(b => b.viTri === 'phu_tren') || null);
        setBannerPhuSau(activeBanners.find(b => b.viTri === 'phu_duoi') || null);
      })
      .catch(err => console.error("Lỗi khi tải banner từ server:", err))
      .finally(() => setDangTai(false));
  }, []);

  const tong = bannerSlides.length;

  // 2. Tự động chuyển slide
  useEffect(() => {
    if (tong < 2 || dangDung) return;
    const t = setTimeout(() => {
      setCurrentIndex(i => (i + 1) % tong);
    }, THOI_GIAN_TU_CHUYEN);
    return () => clearTimeout(t);
  }, [currentIndex, tong, dangDung]);

  // 3. Tải trước ảnh của slide kế tiếp cho mượt (ảnh lớn/4K nên cần tải sẵn)
  useEffect(() => {
    if (tong < 2) return;
    const tiepTheo = bannerSlides[(currentIndex + 1) % tong];
    if (tiepTheo?.hinhAnh) {
      const img = new Image();
      img.src = tiepTheo.hinhAnh;
    }
  }, [currentIndex, tong, bannerSlides]);

  const goToPrev = () => setCurrentIndex(i => (i === 0 ? tong - 1 : i - 1));
  const goToNext = () => setCurrentIndex(i => (i + 1) % tong);

  // Khung chờ khi đang tải
  if (dangTai) {
    return (
      <div className="bn-wrap bn-wrap--full">
        <div className="bn-hero bn-skeleton" />
      </div>
    );
  }

  // Không có banner nào đang bật -> ẩn luôn khu vực này
  if (tong === 0 && !bannerPhuTruoc && !bannerPhuSau) return null;

  const slide = bannerSlides[Math.min(currentIndex, tong - 1)];
  const coPhu = !!(bannerPhuTruoc || bannerPhuSau);
  const coNoiDung = !!(slide && (slide.tieuDe || slide.moTa));

  // Dải ảnh nhỏ: tối đa 6 ảnh, luôn bao quanh slide đang chọn
  const SO_THUMB = 6;
  const batDau = Math.max(0, Math.min(currentIndex - 2, tong - SO_THUMB));
  const thumbs = bannerSlides.slice(batDau, batDau + SO_THUMB);

  return (
    <div className={`bn-wrap ${coPhu ? "" : "bn-wrap--full"}`}>
      {/* ===== SLIDER CHÍNH ===== */}
      {slide && (
        <div
          className="bn-hero"
          onMouseEnter={() => setDangDung(true)}
          onMouseLeave={() => setDangDung(false)}
        >
          {/* key đổi theo slide để chạy hiệu ứng mờ dần mỗi lần chuyển */}
          <img
            key={slide.maBanner || currentIndex}
            src={slide.hinhAnh}
            alt={slide.tieuDe || slide.tenBanner || "Banner"}
            className="bn-img"
            decoding="async"
          />

          {coNoiDung ? (
            <>
              <div className="bn-overlay" />
              <div className="bn-content" key={`c-${slide.maBanner || currentIndex}`}>
                {slide.tenBanner && <span className="bn-tag">{slide.tenBanner}</span>}
                {slide.tieuDe && <h2 className="bn-title">{slide.tieuDe}</h2>}
                {slide.moTa && <p className="bn-desc">{slide.moTa}</p>}
                <div className="bn-buttons">
                  <a href={slide.duongDan || "#"} className="bn-btn bn-btn-primary">
                    {slide.textNutBam || "Nhận ưu đãi ngay"}
                    <i className="bx bx-chevron-right"></i>
                  </a>
                  <button type="button" className="bn-btn bn-btn-outline">Chi tiết chương trình</button>
                </div>
              </div>
            </>
          ) : (
            // Banner chỉ có ảnh (không tiêu đề/mô tả): bấm vào ảnh để đi tới đường dẫn
            slide.duongDan && (
              <a href={slide.duongDan} className="bn-fill-link" aria-label={slide.tenBanner || "Xem banner"} />
            )
          )}

          {tong > 1 && (
            <>
              <button type="button" className="bn-nav bn-nav-prev" onClick={goToPrev} aria-label="Banner trước">
                <i className="bx bx-chevron-left"></i>
              </button>
              <button type="button" className="bn-nav bn-nav-next" onClick={goToNext} aria-label="Banner sau">
                <i className="bx bx-chevron-right"></i>
              </button>

              {/* Dải ảnh nhỏ (máy tính) */}
              <div className="bn-thumbs">
                {thumbs.map((b, i) => {
                  const viTri = batDau + i;
                  return (
                    <button
                      type="button"
                      key={b.maBanner || viTri}
                      className={`bn-thumb ${viTri === currentIndex ? "active" : ""}`}
                      onClick={() => setCurrentIndex(viTri)}
                      aria-label={`Xem banner ${viTri + 1}`}
                    >
                      <img src={b.hinhAnh} alt="" loading="lazy" />
                    </button>
                  );
                })}
              </div>

              {/* Chấm tròn (điện thoại) */}
              <div className="bn-dots">
                {bannerSlides.map((_, index) => (
                  <span
                    key={index}
                    className={`bn-dot ${index === currentIndex ? "active" : ""}`}
                    onClick={() => setCurrentIndex(index)}
                  ></span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== BANNER PHỤ (vị trí phu_tren, phu_duoi) ===== */}
      {coPhu && (
        <div className="bn-side">
          <div className="bn-side-inner">
            {bannerPhuTruoc && (
              <a href={bannerPhuTruoc.duongDan || "#"} className="bn-side-item">
                <img src={bannerPhuTruoc.hinhAnh} alt={bannerPhuTruoc.tenBanner || "Banner phụ"} />
              </a>
            )}
            {bannerPhuSau && (
              <a href={bannerPhuSau.duongDan || "#"} className="bn-side-item">
                <img src={bannerPhuSau.hinhAnh} alt={bannerPhuSau.tenBanner || "Banner phụ"} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Banner;
