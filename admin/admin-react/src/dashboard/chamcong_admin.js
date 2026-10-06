import React, { useState, useEffect } from "react";
import "./chamcong_admin.css";
import axios from "axios";

function ChamCong() {
    // LAT LICH TU DONG THEO THANG
    const layThangHienTai = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const [thangNam, setThangNam] = useState(layThangHienTai());
    const [danhSachTongHop, setDanhSachTongHop] = useState([]);

    const [nam, thang] = thangNam.split("-");
    const soNgayTrongThang = new Date(nam, thang, 0).getDate();
    const mangNgay = Array.from({ length: soNgayTrongThang }, (_, i) => i + 1);

    const isChuNhat = (ngay) => new Date(nam, thang - 1, ngay).getDay() === 0;
    const tongNgayCongChuan = mangNgay.filter(ngay => !isChuNhat(ngay)).length;


    // =============== THONG BAO THANH CONG ================ 
    const [thongBaoChamCong, setThongBaoChamCong] = useState(null);

    const hienThiThongBao = (noiDung) => {
        setThongBaoChamCong(noiDung);
        setTimeout(() => {
            setThongBaoChamCong(null);
        }, 3000);
    };

    useEffect(() => {
        axios.get(`http://localhost:8080/api/chamcong?thang=${thang}&nam=${nam}`)
            .then((response) => {
                const rawData = response.data;

                // GOM NHÓM DỮ LIỆU TỪ SQL BẰNG .REDUCE()
                const groupedData = rawData.reduce((acc, curr) => {
                    if (!acc[curr.maNV]) {
                        acc[curr.maNV] = {
                            maNV: curr.maNV,
                            hoTen: curr.hoTen,
                            tenCV: curr.tenCV || "Nhân viên",
                            ngayDiLam: [],
                            luongCoBan: curr.luongCoBan || 0,
                            luongThuong: curr.luongThuong || 0,
                            luongThucNhan: curr.luongThucNhan || 0,
                            tongNgayCong: curr.tongNgayCong || 0
                        };
                    }

                    if (curr.thoiGianChamCong) {
                        const ngayStr = curr.thoiGianChamCong.split('T')[0];
                        const ngay = parseInt(ngayStr.split('-')[2], 10);
                        if (!acc[curr.maNV].ngayDiLam.includes(ngay)) {
                            acc[curr.maNV].ngayDiLam.push(ngay);
                        }
                    }
                    return acc;
                }, {});

                setDanhSachTongHop(Object.values(groupedData));
            })
            .catch((error) => console.error("Lỗi tải chấm công:", error));
    }, [thangNam, thang, nam]);

    const formatTien = (soTien) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(soTien);
    };

    const handleTinhLuong = async () => {
        const xacNhan = window.confirm(`Bạn có chắc chắn muốn tính/cập nhật lương tháng ${thang}/${nam} cho toàn bộ nhân viên không?`);

        if (xacNhan) {
            try {
                const response = await axios.post("http://localhost:8080/api/luong/tinh-toan", {
                    thang: parseInt(thang),
                    nam: parseInt(nam)
                });

                if (response.data.success) {
                    hienThiThongBao(`Tính lương tháng ${thang}/${nam} thành công!`);
                    
                }
            } catch (error) {
                console.error("Lỗi khi tính lương:", error);
                alert("Có lỗi xảy ra khi tính lương. Vui lòng xem log ở Backend.");
            }
        }
    };

    // ================= STATE QUẢN LÝ MODAL PHIẾU LƯƠNG =================
    const [hienModalPhieuLuong, setHienModalPhieuLuong] = useState(false);
    const [nhanVienDangXem, setNhanVienDangXem] = useState(null);

    const moPhieuLuong = (nv) => {
        setNhanVienDangXem(nv);
        setHienModalPhieuLuong(true);
    };

    const dongPhieuLuong = () => {
        setHienModalPhieuLuong(false);
        setNhanVienDangXem(null);
    };

    // ================= STATE QUẢN LÝ MODAL SỬA LƯƠNG (GIÁM ĐỐC) =================
    const [hienModalSuaLuong, setHienModalSuaLuong] = useState(false);
    const [nvSuaLuong, setNvSuaLuong] = useState({ maNV: "", hoTen: "", luongCoBan: 0, luongThuong: 0 });

    const moModalSuaLuong = (nv) => {
        setNvSuaLuong({
            maNV: nv.maNV,
            hoTen: nv.hoTen,
            luongCoBan: nv.luongCoBan || 0,
            luongThuong: nv.luongThuong || 0
        });
        setHienModalSuaLuong(true);
    };

    // Lấy thông tin tài khoản Admin/Nhân viên đang đăng nhập từ LocalStorage
    const adminInfo = JSON.parse(localStorage.getItem("adminData") || "{}");
    const laGiamDoc = adminInfo.maCV === 'CV01'; // Giả định mã chức vụ Giám đốc là CV01

    // Hàm gọi API lưu sửa lương
    const luuSuaLuong = async () => {
        try {
            const res = await axios.put(`http://localhost:8080/api/luong/cap-nhat-co-ban/${nvSuaLuong.maNV}`, {
                luongCoBanMoi: nvSuaLuong.luongCoBan,
                luongThuongMoi: nvSuaLuong.luongThuong,
                maCVNguoiThaoTac: adminInfo.maCV
            });

            if (res.data.success) {
                hienThiThongBao("Cập nhật lương thành công! Hãy bấm 'Tính lương tự động' để cập nhật lại thực nhận.");
                setHienModalSuaLuong(false);
                
            }
        } catch (error) {
            console.error("Lỗi cập nhật lương:", error);
            alert(error.response?.data?.message || "Không thể cập nhật lương.");
        }
    };

    return (
        <div className="cc-container">
            {/* HIEN THI THONG BAO */}
            {thongBaoChamCong && (
                <div className="cham-cong">
                    <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
                    <span>{thongBaoChamCong}</span>
                </div>
            )}
            {/* --- HEADER --- */}
            <div className="cc-header-wrapper">
                <div>
                    <h2 className="cc-title">Chấm công & lương</h2>
                    <p className="cc-subtitle">Theo dõi chuyên cần và tự động tính toán bảng lương nhân sự</p>
                </div>
                <div className="cc-actions">
                    <input
                        type="month"
                        className="cc-month-picker"
                        value={thangNam}
                        onChange={(e) => setThangNam(e.target.value)}
                    />
                    <button className="cc-btn-tinhluong" onClick={handleTinhLuong}>
                        <i className='bx bx-refresh'></i> Tính lương tự động
                    </button>
                </div>
            </div>

            {/* --- BẢNG 1: CHẤM CÔNG --- */}
            <div className="cc-card">
                <div className="cc-card-header">
                    <h3>Bảng Chấm Công (Tháng {thang}/{nam})</h3>
                    <span className="cc-legend">
                        Ký hiệu:
                        <i className="bx bx-radio-circle bx-remove-padding" /> Đã chấm công | Rỗng: Nghỉ phép
                    </span>
                </div>
                <div className="cc-table-wrapper">
                    <table className="cc-table">
                        <thead>
                            <tr>
                                <th className="th-name">Họ tên nhân viên</th>
                                {mangNgay.map(ngay => (
                                    <th key={ngay} className={isChuNhat(ngay) ? "th-chunhat" : ""}>{ngay}</th>
                                ))}
                                <th className="th-total">Tổng công</th>
                            </tr>
                        </thead>
                        <tbody>
                            {danhSachTongHop.map((nv, index) => (
                                <tr key={index}>
                                    <td className="td-name">
                                        <div className="nv-hoten">{nv.hoTen}</div>
                                        <div className="nv-chucvu">{nv.tenCV}</div>
                                    </td>

                                    {mangNgay.map(ngay => {
                                        const chuNhat = isChuNhat(ngay);
                                        const coDiLam = nv.ngayDiLam.includes(ngay);
                                        return (
                                            <td key={ngay} className={chuNhat ? "td-chunhat" : "td-dot"}>
                                                {chuNhat ? <span className="text-chunhat">-</span>
                                                    : coDiLam ? <div className="dot-green"></div>
                                                        : <div className="box-gray"></div>}
                                            </td>
                                        );
                                    })}

                                    <td className="td-total"><strong>{nv.tongNgayCong}</strong> / {tongNgayCongChuan}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- BẢNG 2: BẢNG LƯƠNG --- */}
            <div className="cc-card">
                <div className="cc-card-header">
                    <h3>Bảng Tính Lương Chi Tiết</h3>
                    <button className="btn-outline-blue">
                        <i className="bx bx-file-report" /> Xuất Excel báo cáo
                    </button>
                </div>
                <div className="cc-table-wrapper">
                    <table className="cc-table">
                        <thead>
                            <tr>
                                <th>Họ tên</th>
                                <th>Chức vụ</th>
                                <th>Ngày công</th>
                                <th>Lương cơ bản</th>
                                <th>Lương thưởng</th>
                                <th>Lương thực nhận</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="cc-tbody">
                            {danhSachTongHop.map((nv, idx) => (
                                <tr key={idx}>
                                    <td className="cc-td-hoten"><strong>{nv.hoTen}</strong></td>
                                    <td className="cc-td-chucvu"><strong>{nv.tenCV}</strong></td>
                                    <td className="cc-td-tongNgayCong">{nv.tongNgayCong} công</td>
                                    <td className="cc-td-luongcoban">{formatTien(nv.luongCoBan)}</td>
                                    <td className="cc-td-luongthuong">{formatTien(nv.luongThuong)}</td>
                                    <td className="cc-td-tongluong">{formatTien(nv.luongThucNhan)}</td>
                                    <td className="cc-td-btn">
                                        <button className="cc-td-btn-xem" onClick={() => moPhieuLuong(nv)}>
                                            Xem phiếu lương
                                        </button>
                                        {/* CHỈ HIỂN THỊ NÚT SỬA LƯƠNG KHI TÀI KHOẢN ĐĂNG NHẬP LÀ GIÁM ĐỐC */}
                                        {laGiamDoc && (
                                            <button className="cc-td-btn-sua" onClick={() => moModalSuaLuong(nv)}  >
                                                Sửa lương
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL XEM PHIẾU LƯƠNG CHI TIẾT --- */}
            {hienModalPhieuLuong && nhanVienDangXem && (
                <div className="modal-overlay" onClick={dongPhieuLuong}>
                    <div className="pl-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="pl-modal-header">
                            <h3 className="pl-modal-title">Phiếu Lương Tháng {thang}/{nam}</h3>
                            <button className="pl-close-btn" onClick={dongPhieuLuong}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="pl-modal-body">
                            <div>
                                <span><strong>Mã nhân viên:</strong> {nhanVienDangXem.maNV}</span>
                            </div>
                            <div>
                                <span><strong>Họ và tên:</strong> {nhanVienDangXem.hoTen}</span>
                            </div>
                            <div>
                                <span><strong>Chức vụ:</strong> {nhanVienDangXem.tenCV}</span>
                            </div>
                            <hr className="pl-divider-dashed" />
                            <div className="pl-row">
                                <span>Tổng ngày công:</span>
                                <strong>{nhanVienDangXem.tongNgayCong} / {tongNgayCongChuan} công</strong>
                            </div>
                            <div className="pl-row">
                                <span>Lương cơ bản:</span>
                                <span>{formatTien(nhanVienDangXem.luongCoBan)}</span>
                            </div>
                            <div className="pl-row">
                                <span>Lương thưởng:</span>
                                <span className="pl-thuong">+ {formatTien(nhanVienDangXem.luongThuong)}</span>
                            </div>
                            <hr className="pl-divider-solid" />
                            <div className="pl-thuc-nhan">
                                <span><strong>Thực nhận:</strong></span>
                                <strong>{formatTien(nhanVienDangXem.luongThucNhan)}</strong>
                            </div>
                        </div>

                        <div className="pl-modal-actions">
                            <button className="pl-btn-dong" onClick={dongPhieuLuong}>Đóng</button>
                            <button className="pl-btn-in" onClick={() => window.print()}>In phiếu lương</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL SỬA LƯƠNG (CHỈ DÀNH CHO GIÁM ĐỐC) --- */}
            {hienModalSuaLuong && (
                <div className="modal-overlay" onClick={() => setHienModalSuaLuong(false)}>
                    <div className="pl-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="pl-modal-header">
                            <h3 className="pl-modal-title">Cập nhật lương: {nvSuaLuong.hoTen}</h3>
                            <button className="pl-close-btn" onClick={() => setHienModalSuaLuong(false)}>
                                <i className="bx bx-x"></i>
                            </button>
                        </div>

                        <div className="pl-modal-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label><strong>Lương cơ bản (VNĐ):</strong></label>
                                <input 
                                    type="number" 
                                    value={nvSuaLuong.luongCoBan} 
                                    onChange={(e) => setNvSuaLuong({...nvSuaLuong, luongCoBan: e.target.value})}
                                    style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                                <label><strong>Thưởng thêm (VNĐ):</strong></label>
                                <input 
                                    type="number" 
                                    value={nvSuaLuong.luongThuong} 
                                    onChange={(e) => setNvSuaLuong({...nvSuaLuong, luongThuong: e.target.value})}
                                    style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                        </div>

                        <div className="pl-modal-actions">
                            <button className="pl-btn-dong" onClick={() => setHienModalSuaLuong(false)}>Hủy</button>
                            <button className="pl-btn-in" onClick={luuSuaLuong} style={{ background: "#16a34a" }}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChamCong;