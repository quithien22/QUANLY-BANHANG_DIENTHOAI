import React, { useState, useEffect } from "react";
import "./vanchuyen_admin.css";
import { vanChuyenApi } from "../../API/VanChuyenApi";

function VanChuyen_Admin() {
    const [danhSachVanChuyen, setDanhSachVanChuyen] = useState([]);

    // TÌNH TRẠNG VẬN CHUYỂN
    const TinhTrangVanChuyen = [
        { nhan: "Chờ lấy hàng", giaTri: "cho_lay_hang", mauLop: "cam" },
        { nhan: "Đang giao", giaTri: "dang_giao", mauLop: "xanh" },
        { nhan: "Đã giao", giaTri: "da_giao", mauLop: "xanhla" },
        { nhan: "Đã hủy", giaTri: "da_huy", mauLop: "do" }
    ];

    const [boLoc, setBoLoc] = useState("tat_ca");

    const chuanHoaTrangThai = (trangThai) => {
        const giaTri = String(trangThai || "").trim().toLowerCase();
        const aliases = {
            "chờ lấy hàng": "cho_lay_hang", "cho lay hang": "cho_lay_hang", cho_lay_hang: "cho_lay_hang",
            "đang giao": "dang_giao", "dang giao": "dang_giao", dang_giao: "dang_giao",
            "đã giao": "da_giao", "da giao": "da_giao", da_giao: "da_giao",
            "đã hủy": "da_huy", "da huy": "da_huy", da_huy: "da_huy"
        };
        return aliases[giaTri] || giaTri;
    };

// =============== THONG BAO THANH CONG ================ 
  // State quản lý Toast thông báo góc phải
    const [thongBaoVanChuyen, setThongBaoVanChuyen] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoVanChuyen(noiDung);
        setTimeout(() => {
            setThongBaoVanChuyen(null);
        }, 3000);
    };
// ============== DANH SACH VAN CHUYEN DON HANG 
 
    const taiLaiDanhSachVanChuyen = () => {
        vanChuyenApi.layDanhSach()
            .then((danhSach) => {
                const duLieu = Array.isArray(danhSach)
                    ? danhSach
                    : danhSach?.data || danhSach?.content || danhSach?.items || [];
                const duLieuHopLe = duLieu.filter(vc => chuanHoaTrangThai(vc.trangThai) !== 'da_huy');
                
                setDanhSachVanChuyen(duLieuHopLe);
            })
            .catch((error) => {
                console.error("Lỗi khi kết nối tới Backend:", error);
            });
    };

    useEffect(() => {
        taiLaiDanhSachVanChuyen();
    }, []); 

    // Lọc danh sách theo tab đang chọn
    const danhSachDaLoc = boLoc === "tat_ca"
        ? danhSachVanChuyen
        : danhSachVanChuyen.filter((vc) => chuanHoaTrangThai(vc.trangThai) === boLoc);

    const layThongTinTrangThai = (giaTri) => {
        const chuanHoa = chuanHoaTrangThai(giaTri);
        return TinhTrangVanChuyen.find((tt) => tt.giaTri === chuanHoa) || { nhan: giaTri, mauLop: "gray" };
    };

    // ĐƠN VỊ VẬN CHUYỂN
    const banDoDonViVanChuyen = {
        "Giao Hàng Tiết Kiệm": { ma: "GHTK", mauLop: "blue" },
        "Giao Hàng Nhanh": { ma: "GHN", mauLop: "cyan" },
        "J&T Express": { ma: "J&T", mauLop: "red" },
        "Viettel Post": { ma: "VTP", mauLop: "orange" },
        "Ninja Van": { ma: "NJV", mauLop: "purple" },
    };

    const layThongTinDonVi = (tenDayDu) => {
        if (banDoDonViVanChuyen[tenDayDu]) return banDoDonViVanChuyen[tenDayDu];
        const chuCaiDau = (tenDayDu || "??").split(" ").map((tu) => tu[0]).join("").slice(0, 3).toUpperCase();
        return { ma: chuCaiDau, mauLop: "gray" };
    };

    // ============== MODAL 1: SỬA VẬN CHUYỂN ===========
    const [hienModalSua, setHienModalSua] = useState(false);
    const [donDangSua, setDonDangSua] = useState(null);
    const [formSua, setFormSua] = useState({
        trangThai: "",
        ngayGiaoDuKien: "",
        maHoaDon: "",  
        donViVanChuyen: "",
    });

    const moModalSua = (vc) => {
        setDonDangSua(vc);
        let ngayFormat = "";
        if (vc.ngayGiaoDuKien) {
            ngayFormat = new Date(vc.ngayGiaoDuKien).toISOString().split('T')[0];
        }

        setFormSua({
            trangThai: chuanHoaTrangThai(vc.trangThai) || "cho_lay_hang",
            ngayGiaoDuKien: ngayFormat,
            maHoaDon: vc.maVanDon || "",
            donViVanChuyen: vc.donViVanChuyen || "",
        });
        setHienModalSua(true);
    };

    const dongModalSua = () => {
        setHienModalSua(false);
        setDonDangSua(null);
    };

    const capNhatFormSua = (field, value) => {
        setFormSua({ ...formSua, [field]: value });
    };

    const luuThayDoiVanChuyen = () => {
        if (!donDangSua) return;
        vanChuyenApi.capNhat(donDangSua.maVanChuyen, formSua)
            .then(() => {
                hienThiThongBao("Cập nhật vận chuyển thành công!")
                taiLaiDanhSachVanChuyen();
                dongModalSua();
            })
            .catch((error) => {
                console.error("Lỗi khi cập nhật vận chuyển:", error);
                alert("Lỗi khi cập nhật vận chuyển!");
            });
    };

    // ============== MODAL 2: CHI TIẾT VẬN CHUYỂN ===========
    const [hienModalChiTiet, setHienModalChiTiet] = useState(false);
    const [donDangXem, setDonDangXem] = useState(null);

    const moModalChiTiet = (vc) => {
        setDonDangXem(vc);
        setHienModalChiTiet(true);
    };

    const dongModalChiTiet = () => {
        setHienModalChiTiet(false);
        setDonDangXem(null);
    };

    // PHÂN TRANG (Áp dụng theo danh sách đã lọc tab)
    const soLuongDonHangMotTrang = 10;
    const [trangThaiVanChuyen, setTrangThaiVanChuyen] = useState(1);

    const tinhSoTrang = Math.ceil(danhSachDaLoc.length / soLuongDonHangMotTrang);
    const viTriBatDauTrang = (trangThaiVanChuyen - 1) * soLuongDonHangMotTrang;
    const sanPhamDangHienDonHang = danhSachDaLoc.slice(viTriBatDauTrang, viTriBatDauTrang + soLuongDonHangMotTrang);
    const danhSachTrangVanChuyen = Array.from({ length: tinhSoTrang }, (_, i) => i + 1);

    return (
        <div className="vc-container">

            {/* HIEN THI THONG BAO */}
            {thongBaoVanChuyen && (
                <div className="van-chuyen">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoVanChuyen}</span>
                </div>
            )}

            <div className="vc-header">
                <span className="vc-title">Vận chuyển</span>
                <label className="vc-subtitle">Theo dõi trạng thái giao vận liên sàn và kết nối đơn vị vận chuyển</label>
            </div>

            <div className="vc-filter-tabs">
                <button
                    className={`vc-filter-btn ${boLoc === "tat_ca" ? "active" : ""}`}
                    onClick={() => { setBoLoc("tat_ca"); setTrangThaiVanChuyen(1); }}
                >
                    Tất cả
                </button>
                {TinhTrangVanChuyen.map((tt) =>
                    <button
                        key={tt.giaTri}
                        className={`vc-filter-btn ${boLoc === tt.giaTri ? "active" : ""}`}
                        onClick={() => { setBoLoc(tt.giaTri); setTrangThaiVanChuyen(1); }}
                    >
                        {tt.nhan}
                    </button>
                )}
            </div>

            <table className="vc-table">
                <thead>
                    <tr>
                        <th>Mã vận chuyển</th>
                        <th>Đơn vị vận chuyển</th>
                        <th>Mã đơn hàng gốc</th>
                        <th>Người nhận / SĐT</th>
                        <th>Ngày dự kiến giao</th>
                        <th>Trạng thái hiện tại</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {sanPhamDangHienDonHang.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="vc-trong">Không có đơn hàng nào ở trạng thái này.</td>
                        </tr>
                    ) : (
                        sanPhamDangHienDonHang.map((vc, i) => {
                            const donVi = layThongTinDonVi(vc.donViVanChuyen);
                            const trangThai = layThongTinTrangThai(vc.trangThai);
                            return (
                                <tr key={vc.maVanChuyen ?? i}>
                                    <td className="vc-ma-don">{vc.maVanChuyen}</td>
                                    <td>
                                        <div className="vc-dvvc-cell">
                                            <span className={`vc-badge-dvvc dvvc-${donVi.mauLop}`}>{donVi.ma}</span>
                                            <span className="vc-dvvc-ten">{vc.donViVanChuyen || "Chưa chọn"}</span>
                                        </div>
                                    </td>
                                    <td>{vc.maHoaDon}</td>
                                    <td>
                                        <div className="vc-nguoinhan">
                                            <span className="vc-nguoinhan-ten">{vc.hoTen || "Khách lẻ"}</span>
                                            <span className="vc-nguoinhan-sdt">{vc.SDT || "---"}</span>
                                        </div>
                                    </td>
                                    <td>{vc.ngayGiaoDuKien ? new Date(vc.ngayGiaoDuKien).toLocaleDateString('vi-VN') : "---"}</td>
                                    <td>
                                        <span className={`vc-trangthai trangthai-${trangThai.mauLop}`}>
                                            {trangThai.nhan}
                                        </span>
                                    </td>
                                    <td className="vc-actions">
                                        <button className="vc-btn-sua" onClick={() => moModalSua(vc)}>
                                            <i className="bx bx-edit-alt"></i> Sửa
                                        </button>
                                        <button className="vc-btn-chitiet" onClick={() => moModalChiTiet(vc)}>
                                            <i className="bx bx-show"></i> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* FOOTER PHÂN TRANG */}
            {tinhSoTrang > 1 && (
                <div className="vc-page-pagination">
                    <span> 
                        Hiển thị {danhSachDaLoc.length === 0 ? 0 : viTriBatDauTrang + 1} - {Math.min(viTriBatDauTrang + soLuongDonHangMotTrang, danhSachDaLoc.length)} trên tổng số {danhSachDaLoc.length} đơn vận chuyển.
                    </span>

                    <div className="vc-pagesp-pagination">
                        <button
                            className="vc-page-page_btn"
                            onClick={() => setTrangThaiVanChuyen(trangThaiVanChuyen - 1)}
                            disabled={trangThaiVanChuyen === 1}
                        >
                            <i className="bx bx-chevron-left"></i>
                        </button>

                        {danhSachTrangVanChuyen.map((soTrang) => (
                            <button
                                key={soTrang}
                                className={`vc-page-page_btn ${trangThaiVanChuyen === soTrang ? "active" : ""}`}
                                onClick={() => setTrangThaiVanChuyen(soTrang)}
                            >
                                {soTrang}
                            </button>
                        ))}

                        <button
                            className="vc-page-page_btn"
                            onClick={() => setTrangThaiVanChuyen(trangThaiVanChuyen + 1)}
                            disabled={trangThaiVanChuyen === tinhSoTrang || tinhSoTrang === 0}
                        >
                            <i className="bx bx-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 1 - SỬA VẬN CHUYỂN */}
            {hienModalSua && donDangSua && (
                <div className="modal-overlay" onClick={dongModalSua}>
                    <div className="modal-box-vc" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cập nhật vận chuyển - {donDangSua.maVanChuyen}</h3>
                            <button onClick={dongModalSua}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="modal-field">
                            <label>Đơn vị vận chuyển</label>
                            <input
                                type="text"
                                value={formSua.donViVanChuyen}
                                onChange={(e) => capNhatFormSua("donViVanChuyen", e.target.value)}
                            />
                        </div>

                        <div className="modal-field">
                            <label>Mã vận đơn</label>
                            <input
                                type="text"
                                value={formSua.maHoaDon}
                                onChange={(e) => capNhatFormSua("maHoaDon", e.target.value)}
                            />
                        </div>

                        <div className="modal-row">
                            <div className="modal-field">
                                <label>Ngày dự kiến giao</label>
                                <input
                                    type="date"
                                    value={formSua.ngayGiaoDuKien}
                                    onChange={(e) => capNhatFormSua("ngayGiaoDuKien", e.target.value)}
                                />
                            </div>
                            <div className="modal-field">
                                <label>Trạng thái</label>
                                <select
                                    value={formSua.trangThai}
                                    onChange={(e) => capNhatFormSua("trangThai", e.target.value)}
                                >
                                    {TinhTrangVanChuyen.map((tt) => (
                                        <option key={tt.giaTri} value={tt.giaTri}>{tt.nhan}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={dongModalSua}>Hủy</button>
                            <button className="btn-save" onClick={luuThayDoiVanChuyen}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2 - CHI TIẾT VẬN CHUYỂN */}
            {hienModalChiTiet && donDangXem && (
                <div className="modal-overlay" onClick={dongModalChiTiet}>
                    <div className="modal-box-vc" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết vận chuyển: {donDangXem.maVanChuyen}</h3>
                            <button onClick={dongModalChiTiet}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="vc-chitiet-grid">
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Đơn vị vận chuyển</span>
                                <span className="vc-chitiet-giatri">{donDangXem.donViVanChuyen || "Chưa có"}</span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Mã đơn hàng gốc</span>
                                <span className="vc-chitiet-giatri">{donDangXem.maHoaDon}</span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Mã vận đơn</span>
                                <span className="vc-chitiet-giatri">{donDangXem.maVanDon || "Chưa có"}</span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Người nhận</span>
                                <span className="vc-chitiet-giatri">{donDangXem.hoTen || "Khách lẻ"}</span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Số điện thoại</span>
                                <span className="vc-chitiet-giatri">{donDangXem.SDT || "---"}</span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Địa chỉ nhận hàng</span>
                                <span className="vc-chitiet-giatri">{donDangXem.diaChiChiTiet || "---"}</span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Ngày dự kiến giao</span>
                                <span className="vc-chitiet-giatri">
                                    {donDangXem.ngayGiaoDuKien ? new Date(donDangXem.ngayGiaoDuKien).toLocaleDateString('vi-VN') : "---"}
                                </span>
                            </div>
                            <div className="vc-chitiet-dong">
                                <span className="vc-chitiet-nhan">Trạng thái hiện tại</span>
                                <span className={`vc-trangthai trangthai-${layThongTinTrangThai(donDangXem.trangThai).mauLop}`}>
                                    {layThongTinTrangThai(donDangXem.trangThai).nhan}
                                </span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <div></div>
                            <button className="btn-cancel" onClick={dongModalChiTiet}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VanChuyen_Admin;