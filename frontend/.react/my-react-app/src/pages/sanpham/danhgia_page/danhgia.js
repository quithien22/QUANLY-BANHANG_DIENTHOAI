import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { reviewApi } from "../../../API/ReviewApi";
import { userSession } from "../../../utils/UserSession";
import { layUrlAnh } from "../../../utils/imageUrl";
import "./danhgia.css";

function formatThoiGian(isoString) {
    if (!isoString) return "";
    const diffMs = new Date() - new Date(isoString);
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "Vừa xong";
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Hôm qua";
    return `${diffD} ngày trước`;
}

function DanhGiaSanPhamSection({ productId }) {
    const [reviews, setReviews] = useState([]);
    const [filter, setFilter] = useState("all");
    const [chonSao, setChonSao] = useState(0);
    const [noiDung, setNoiDung] = useState("");
    const [dangTai, setDangTai] = useState(true);
    const [thongBao, setThongBao] = useState(false);
    const [noiDungThongBao, setNoiDungThongBao] = useState("");

    // STATE DÀNH CHO TÍNH NĂNG SỬA
    const [idDangSua, setIdDangSua] = useState(null);
    const [saoSua, setSaoSua] = useState(0);
    const [noiDungSua, setNoiDungSua] = useState("");

    const nguoiDung = userSession.get();
    const maKH = nguoiDung?.maKH;

    const taiDanhSachDanhGia = () => {
        setDangTai(true);
        reviewApi.list(productId)
            .then(data => setReviews(data))
            .catch(err => console.error("Lỗi lấy đánh giá:", err))
            .finally(() => setDangTai(false));
    };

    useEffect(() => {
        if (productId) taiDanhSachDanhGia();
    }, [productId]);

    const { avgRatingCalc, totalReviewsCalc, ratingBreakdown } = useMemo(() => {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let tongSao = 0;

        reviews.forEach(r => {
            counts[r.soSao] = (counts[r.soSao] || 0) + 1;
            tongSao += r.soSao;
        });

        return {
            avgRatingCalc: reviews.length > 0 ? (tongSao / reviews.length).toFixed(1) : "0.0",
            totalReviewsCalc: reviews.length,
            ratingBreakdown: counts
        };
    }, [reviews]);

    const filteredReviews = filter === "all"
        ? reviews
        : reviews.filter(r => r.soSao === Number(filter));

    // KÍCH HOẠT THÔNG BÁO TRƯỢT
    const hienThiThongBao = (loiNhan) => {
        setNoiDungThongBao(loiNhan);
        setThongBao(true);
        setTimeout(() => setThongBao(false), 3000);
    };

    // HÀM 1: GỬI ĐÁNH GIÁ MỚI
    const handleGuiDanhGia = async () => {
        if (chonSao === 0 || noiDung.trim() === "") {
            alert("Vui lòng chọn số sao và nhập nội dung đánh giá!");
            return;
        }
        if (!maKH) return alert("Vui lòng đăng nhập để gửi đánh giá!");

        try {
            const payload = { maSP: productId, maKH, soSao: chonSao, noiDung };
            const res = await reviewApi.add(payload);

            if (res.success) {
                setChonSao(0);
                setNoiDung("");
                taiDanhSachDanhGia();
                hienThiThongBao("Cảm ơn bạn đã đánh giá!");
            }
        } catch (error) {
            console.error("Lỗi gửi đánh giá:", error);
            alert("Có lỗi xảy ra khi gửi đánh giá.");
        }
    };

    // HÀM 2: XÓA ĐÁNH GIÁ
    const handleXoaDanhGia = async (maDanhGia) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
            try {
                // Truyền maKH qua data body trong phương thức DELETE
                const res = await reviewApi.remove(maDanhGia, maKH);

                if (res.success) {
                    taiDanhSachDanhGia();
                    hienThiThongBao("Đã xóa đánh giá thành công!");
                }
            } catch (error) {
                console.error("Lỗi xóa đánh giá:", error);
                alert("Không thể xóa đánh giá.");
            }
        }
    };

    // HÀM 3: MỞ FORM SỬA
    const batDauSua = (review) => {
        setIdDangSua(review.maDanhGia);
        setSaoSua(review.soSao);
        setNoiDungSua(review.noiDung);
    };

    // HÀM 4: LƯU ĐÁNH GIÁ SAU KHI SỬA
    const handleLuuSuaDanhGia = async (maDanhGia) => {
        if (saoSua === 0 || noiDungSua.trim() === "") return alert("Vui lòng không để trống nội dung hoặc sao!");

        try {
            const res = await reviewApi.update(maDanhGia, { maKH, soSao: saoSua, noiDung: noiDungSua });

            if (res.success) {
                setIdDangSua(null); // Tắt form sửa
                taiDanhSachDanhGia();
                hienThiThongBao("Đã cập nhật đánh giá!");
            }
        } catch (error) {
            console.error("Lỗi sửa đánh giá:", error);
            alert("Không thể cập nhật đánh giá.");
        }
    };

    return (
        <div id="khu-vuc-danh-gia" className="chitietsp-danhgia-wrapper">

            {noiDungThongBao && (
                <div className="danh-gia">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{noiDungThongBao}</span>
                </div>
            )}

            <ul className="chitietsp-danhgia">
                {/* CỘT TRÁI: Tổng quan + Form viết đánh giá */}
                <li className="chitietsp-danhgia-sidebar">
                    <div className="chitietsp-danhgia-tongquan">
                        <span className="chitietsp-danhgia-tieude">Tổng quan đánh giá</span>

                        <div className="chitietsp-danhgia-score-container">
                            <div className="chitietsp-danhgia-diemtb">{avgRatingCalc}</div>
                            <div className="chitietsp-danhgia-score-rat">
                                <div className="chitietsp-danhgia-saotb">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <i key={n} className={`bx ${n <= Math.round(avgRatingCalc) ? "bxs-star" : "bx-star"}`} />
                                    ))}
                                </div>
                                <span className="chitietsp-danhgia-tongso">{totalReviewsCalc} đánh giá thực tế</span>
                            </div>
                        </div>

                        <ul className="chitietsp-danhgia-breakdown">
                            {[5, 4, 3, 2, 1].map(sao => (
                                <li key={sao} className="breakdown-row">
                                    <span className="breakdown-label">{sao} sao</span>
                                    <div className="breakdown-bar">
                                        <div
                                            className="breakdown-bar-fill"
                                            style={{ width: `${totalReviewsCalc ? (ratingBreakdown[sao] / totalReviewsCalc) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="breakdown-count">{ratingBreakdown[sao]}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="chitietsp-danhgia-form">
                        <span className="chitietsp-danhgia-tieude">Viết đánh giá của bạn</span>
                        <div className="form-group">
                            <label className="form-label">Chọn đánh giá sao:</label>
                            <div className="form-chonsao">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <i
                                        key={n}
                                        className={`bx ${n <= chonSao ? "bxs-star" : "bx-star"}`}
                                        onClick={() => setChonSao(n)}
                                        style={{ cursor: "pointer" }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nội dung đánh giá:</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Chia sẻ trải nghiệm thực tế về sản phẩm..."
                                value={noiDung}
                                onChange={e => setNoiDung(e.target.value)}
                            />
                        </div>

                        <button className="form-submit" onClick={handleGuiDanhGia}>
                            GỬI ĐÁNH GIÁ NGAY
                        </button>
                    </div>
                </li>

                {/* CỘT PHẢI: Bộ lọc + Danh sách đánh giá */}
                <li className="chitietsp-danhgia-main">
                    <div className="chitietsp-danhgia-filter">
                        <button className={filter === "all" ? "filter-btn active" : "filter-btn"} onClick={() => setFilter("all")}>
                            Tất cả
                        </button>
                        {[5, 4, 3, 2, 1].map(sao => (
                            <button
                                key={sao}
                                className={filter === sao ? "filter-btn active" : "filter-btn"}
                                onClick={() => setFilter(sao)}
                            >
                                {sao} Sao ({ratingBreakdown[sao]})
                            </button>
                        ))}
                    </div>

                    <ul className="chitietsp-danhgia-list">
                        {dangTai ? (
                            <li className="danhgia-empty">Đang tải đánh giá...</li>
                        ) : filteredReviews.length === 0 ? (
                            <li className="danhgia-empty">Chưa có đánh giá nào phù hợp.</li>
                        ) : (
                            filteredReviews.map(r => (
                                <li key={r.maDanhGia} className="danhgia-item">
                                    <div className="danhgia-item-header">
                                        <div className="danhgia-item-avatar">{r.userName ? r.userName.charAt(0) : "K"}</div>
                                        <div className="danhgia-item-info">
                                            <span className="danhgia-item-name">{r.userName || r.maKH}</span>
                                            <span className="danhgia-item-time">{formatThoiGian(r.ngayTao)}</span>
                                        </div>

                                        {/* NẾU KHÔNG ĐANG SỬA THÌ HIỆN SAO BÌNH THƯỜNG */}
                                        {idDangSua !== r.maDanhGia && (
                                            <div className="danhgia-item-sao">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <i key={n} className={`bx ${n <= r.soSao ? "bxs-star" : "bx-star"}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {r.daMuaHang === true && (
                                        <span className="danhgia-item-verified">
                                            <i className="bx bx-check-shield" /> Đã mua tại Thiệnstore
                                        </span>
                                    )}

                                    {/* KIỂM TRA: Đang ở chế độ sửa hay xem bình thường */}
                                    {idDangSua === r.maDanhGia ? (
                                        <div style={{ marginTop: '10px' }}>
                                            <div className="form-chonsao" style={{ marginBottom: '10px' }}>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <i key={n} className={`bx ${n <= saoSua ? "bxs-star" : "bx-star"}`} onClick={() => setSaoSua(n)} style={{ cursor: "pointer", fontSize: '20px', color: '#F59E0B' }} />
                                                ))}
                                            </div>
                                            <textarea
                                                className="form-textarea"
                                                value={noiDungSua}
                                                onChange={e => setNoiDungSua(e.target.value)}
                                                style={{ marginBottom: '10px' }}
                                            />
                                            <button onClick={() => handleLuuSuaDanhGia(r.maDanhGia)} style={{ padding: '8px 16px', background: '#1D4ED8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Lưu thay đổi</button>
                                            <button onClick={() => setIdDangSua(null)} style={{ padding: '8px 16px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="danhgia-item-content">{r.noiDung}</p>

                                            {/* CHỈ HIỂN THỊ NÚT SỬA/XÓA NẾU ĐÁNH GIÁ LÀ CỦA USER ĐANG ĐĂNG NHẬP */}
                                            {r.maKH === maKH && (
                                                <div className="danhgia-item-actions">
                                                    <span className="danhgia-action-btn edit-btn" onClick={() => batDauSua(r)}>
                                                        Sửa đánh giá
                                                    </span>
                                                    <span className="danhgia-action-btn delete-btn" onClick={() => handleXoaDanhGia(r.maDanhGia)}>
                                                        Xóa
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Hình ảnh và Phản hồi Shop */}
                                    {r.hinhAnh && r.hinhAnh.length > 0 && (
                                        <div className="danhgia-item-images">
                                            {r.hinhAnh.map((imgUrl, idx) => (
                                                <img
                                                    key={idx}
                                                    className="danhgia-img"
                                                    src={layUrlAnh(imgUrl)}
                                                    alt="Đánh giá"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {r.shopReply && (
                                        <div className="danhgia-item-reply">
                                            <div className="danhgia-reply-header">
                                                Thiệnstore phản hồi:
                                                <span className="danhgia-reply-time">{formatThoiGian(r.ngayReply)}</span>
                                            </div>
                                            <p className="danhgia-reply-text">{r.shopReply}</p>
                                        </div>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </li>
            </ul>
             
        </div>
    );
}

export default DanhGiaSanPhamSection;