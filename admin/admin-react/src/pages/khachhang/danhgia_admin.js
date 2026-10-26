import React, { useState, useEffect } from "react";
import './danhgia_admin.css';
import { danhGiaApi } from "../../API/DanhGiaApi";
import { adminSession } from "../../utils/AdminSession";

function DanhGia_Admin() {
    // =============== LAY NHAN VIEN HIEN TAI ======== 
    const nhanVien = adminSession.get();
    const maNV = nhanVien?.maNV || "NV01";

    // DANH SACH DANH GIA
    const [danhSachDanhGia, setdanhSachDanhGia] = useState([]);

    // ===================== API DANH SACH DANH GIA SAN PHAM ===============
    const taiDanhSachAdmin = () => {
        danhGiaApi.layDanhSach()
            .then((danhSach) => {
                setdanhSachDanhGia(danhSach);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiDanhSachAdmin();
    }, []);

    // State quản lý Toast thông báo góc phải
    const [thongBaoDanhGia, setThongBaoDanhGia] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoDanhGia(noiDung);
        setTimeout(() => {
            setThongBaoDanhGia(null);
        }, 3000);
    };

    // ============== BỘ LỌC ===========
    const [boLocSao, setBoLocSao] = useState("tat-ca");
    const [chiHienChuaPhanHoi, setChiHienChuaPhanHoi] = useState(false);

    const danhSachHienThi = danhSachDanhGia.filter((dg) => {
        // 1. Khớp theo số sao
        const khopSao = boLocSao === "tat-ca" || Number(dg.soSao) === Number(boLocSao);

        // 2. Khớp theo checkbox "Chỉ hiện chưa phản hồi"
        const khopChuaPhanHoi = !chiHienChuaPhanHoi || (!dg.phanHoi && !dg.shopReply);

        return khopSao && khopChuaPhanHoi;
    });

    // ============== NỘI DUNG Ô NHẬP PHẢN HỒI ===========
    const [noiDungPhanHoi, setNoiDungPhanHoi] = useState({});
    const [dangXuLy, setDangXuLy] = useState({});

    const capNhatNoiDungPhanHoi = (maDanhGia, value) => {
        setNoiDungPhanHoi((prev) => ({ ...prev, [maDanhGia]: value }));
    };

    // ============== GỬI PHẢN HỒI ===========
    const guiPhanHoi = (dg) => {
        const noiDung = (noiDungPhanHoi[dg.maDanhGia] || "").trim();
        if (!noiDung) return;

        setDangXuLy((prev) => ({ ...prev, [dg.maDanhGia]: true }));

        danhGiaApi.guiPhanHoi({
            maDanhGia: dg.maDanhGia,
            maNV: maNV,
            noiDung: noiDung,
        })
            .then(() => {
                hienThiThongBao("Đã gửi phản hồi thành công!");

                // Cập nhật lại giao diện ngay lập tức
                setdanhSachDanhGia((ds) =>
                    ds.map((item) =>
                        item.maDanhGia === dg.maDanhGia ? { ...item, phanHoi: noiDung, shopReply: noiDung } : item
                    )
                );

                setNoiDungPhanHoi((prev) => {
                    const banSao = { ...prev };
                    delete banSao[dg.maDanhGia];
                    return banSao;
                });
            })
            .catch((error) => {
                console.error("Lỗi khi gửi phản hồi:", error);
                alert("Gửi phản hồi thất bại.");
            })
            .finally(() => {
                setDangXuLy((prev) => ({ ...prev, [dg.maDanhGia]: false }));
            });
    };

    // ============== ẨN / XÓA ĐÁNH GIÁ ===========
    const anDanhGia = (dg) => {
        const xacNhan = window.confirm(`Bạn có chắc chắn muốn xóa đánh giá này không?`);
        if (!xacNhan) return;

        danhGiaApi.xoa(dg.maDanhGia)
            .then(() => {
                setdanhSachDanhGia((ds) => ds.filter((item) => item.maDanhGia !== dg.maDanhGia));
            })
            .catch((error) => {
                console.error("Lỗi khi xóa đánh giá:", error);
            });
    };

    const hienThiSao = (soSao) => {
        const sao = [];
        for (let i = 1; i <= 5; i++) {
            sao.push(
                <i
                    key={i}
                    className={`bx ${i <= Number(soSao) ? "bxs-star" : "bx-star"} dg-star-icon`}
                    style={{ color: '#F59E0B' }}
                ></i>
            );
        }
        return sao;
    };

    const layDanhSachAnh = (dg) => {
        if (Array.isArray(dg.danhSachAnh)) return dg.danhSachAnh;
        if (dg.duongDanDanhGia) return [dg.duongDanDanhGia];
        return [];
    };

    const cacBoLocSao = [
        { nhan: "Tất cả", giaTri: "tat-ca" },
        { nhan: "5 sao", giaTri: 5 },
        { nhan: "4 sao", giaTri: 4 },
        { nhan: "3 sao", giaTri: 3 },
        { nhan: "2 sao", giaTri: 2 },
        { nhan: "1 sao", giaTri: 1 },
    ];

    return (
        <div className="dg-admin-container">
            {thongBaoDanhGia && (
                <div className="danh-gia">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoDanhGia}</span>
                </div>
            )}
            <div className="dg-admin-header-wrapper">
                <div className="dg-admin-header-title">
                    <span className="dg-admin-title-main">Quản lý đánh giá</span>
                    <label className="dg-admin-title-sub">Lắng nghe phản hồi từ khách hàng để cải tiến sản phẩm và dịch vụ</label>
                </div>
                <label className="dg-admin-filter-checkbox">
                    <input
                        type="checkbox"
                        className="dg-checkbox"
                        checked={chiHienChuaPhanHoi}
                        onChange={(e) => setChiHienChuaPhanHoi(e.target.checked)}
                    />
                    <span className="dg-checkbox-label">Chỉ hiện chưa phản hồi</span>
                </label>
            </div>

            <div className="dg-admin-filter-stars">
                {cacBoLocSao.map((bl) => (
                    <button
                        key={bl.giaTri}
                        className={`dg-btn-filter ${boLocSao === bl.giaTri ? "active" : ""}`}
                        onClick={() => setBoLocSao(bl.giaTri)}
                    >
                        {bl.nhan}
                    </button>
                ))}
            </div>

            <ul className="dg-admin-list">
                {danhSachHienThi.length === 0 ? (
                    <li className="dg-admin-empty">Không có đánh giá nào phù hợp.</li>
                ) : (
                    danhSachHienThi.map((dg, i) => (
                        <li key={dg.maDanhGia ?? i} className="dg-admin-item">
                            <div className="dg-item-product-info">
                                <img src={dg.hinhAnh} alt="" className="dg-product-img" />
                                <span className="dg-product-name">{dg.tenSP}</span>
                                {dg.ngayTao && (
                                    <span className="dg-item-time">{new Date(dg.ngayTao).toLocaleString('vi-VN')}</span>
                                )}
                            </div>

                            <div className="dg-item-customer-row">
                                <div className="dg-item-customer-info">
                                    <img src={dg.anhDaiDien} alt="" className="dg-customer-avatar" />
                                    <div className="dg-customer-text">
                                        <span className="dg-customer-name">{dg.hoTen || dg.tenKH}</span>
                                        <span className="dg-customer-sub">Đã mua hàng thực tế</span>
                                    </div>
                                </div>
                                <div className="dg-customer-stars">{hienThiSao(dg.soSao)}</div>
                            </div>

                            <p className="dg-item-content">{dg.noiDung}</p>

                            {layDanhSachAnh(dg).length > 0 && (
                                <div className="dg-review-images">
                                    {layDanhSachAnh(dg).map((anh, k) => (
                                        <img key={k} src={anh} alt="" className="dg-review-img" />
                                    ))}
                                </div>
                            )}

                            {/* HIỂN THỊ PHẢN HỒI CỦA SHOP (Dùng dg.phanHoi hoặc dg.shopReply) */}
                            {(dg.phanHoi || dg.shopReply) ? (
                                <div className="dg-reply-existing">
                                    <span className="dg-reply-existing-label">Phản hồi của shop</span>
                                    <p>{dg.phanHoi || dg.shopReply}</p>
                                </div>
                            ) : (
                                <div className="dg-item-reply-section">
                                    <input
                                        type="text"
                                        placeholder={`Nhập câu trả lời lịch sự để gửi phản hồi...`}
                                        className="dg-reply-input"
                                        value={noiDungPhanHoi[dg.maDanhGia] || ""}
                                        onChange={(e) => capNhatNoiDungPhanHoi(dg.maDanhGia, e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="dg-item-actions">
                                {!(dg.phanHoi || dg.shopReply) && (
                                    <button
                                        className="dg-btn-action dg-btn-reply"
                                        onClick={() => guiPhanHoi(dg)}
                                        disabled={dangXuLy[dg.maDanhGia] || !(noiDungPhanHoi[dg.maDanhGia] || "").trim()}
                                    >
                                        {dangXuLy[dg.maDanhGia] ? "Đang gửi..." : "Gửi phản hồi"}
                                    </button>
                                )}
                                <button className="dg-btn-action dg-btn-hide" onClick={() => anDanhGia(dg)}>
                                    Xóa đánh giá
                                </button>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

export default DanhGia_Admin;