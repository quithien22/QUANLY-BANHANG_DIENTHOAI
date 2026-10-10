import React, { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./thongke_admin.css";
import * as XLSX from "xlsx"; // Import thư viện Excel
import html2pdf from "html2pdf.js"; // Import thư viện PDF

function ThongKe() {
    // 1. Quản lý trạng thái bộ lọc
    const [khoangThoiGian, setKhoangThoiGian] = useState("30ngay");
    const [cheDoBieuDo, setCheDoBieuDo] = useState("ngay"); // Đặt mặc định là 'ngay' để biểu đồ hiện đẹp nhất

    // 2. State lưu dữ liệu từ API
    const [tongQuan, setTongQuan] = useState({ doanhThu: 0, doanhThuThayDoi: 0, tongDonHang: 0, tongDonHangThayDoi: 0, giaTriTB: 0, giaTriTBThayDoi: 0, tyLeHuy: 0, tyLeHuyThayDoi: 0 });
    const [dataBieuDo, setDataBieuDo] = useState([]);
    const [topSanPham, setTopSanPham] = useState([]);
    const [hieuQuaKM, setHieuQuaKM] = useState([]);
    const [tonKho, setTonKho] = useState([]);

    // 3. Gọi các API đồng thời khi bộ lọc thời gian thay đổi
    useEffect(() => {
        const taiDuLieu = async () => {
            try {
                const [tqRes, bdRes, topRes, kmRes, tkRes] = await Promise.all([
                    axios.get(`http://localhost:8080/api/thongke/tongquan?khoang=${khoangThoiGian}`),
                    axios.get(`http://localhost:8080/api/thongke/doanhthu?khoang=${khoangThoiGian}&theo=${cheDoBieuDo}`),
                    axios.get(`http://localhost:8080/api/thongke/top-san-pham?khoang=${khoangThoiGian}`),
                    axios.get(`http://localhost:8080/api/thongke/khuyenmai?khoang=${khoangThoiGian}`),
                    axios.get(`http://localhost:8080/api/thongke/ton-kho-canh-bao`)
                ]);

                setTongQuan(tqRes.data);
                setDataBieuDo(bdRes.data);
                setTopSanPham(topRes.data);
                setHieuQuaKM(kmRes.data);
                setTonKho(tkRes.data);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu thống kê:", error);
            }
        };
        taiDuLieu();
    }, [khoangThoiGian, cheDoBieuDo]);

    // 4. Hàm tiện ích format tiền và số
    const formatTien = (soTien) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(soTien || 0);
    const formatSo = (so) => new Intl.NumberFormat('vi-VN').format(so || 0);
    const renderPhanTram = (so) => {
        const value = Number(so).toFixed(1);
        if (value > 0) return <span className="tk-badge-tang"><i className="bx bx-trending-up"></i> +{value}%</span>;
        if (value < 0) return <span className="tk-badge-giam"><i className="bx bx-trending-down"></i> {value}%</span>;
        return <span className="tk-badge-hoa"> 0%</span>;
    };

    // Tìm max doanh thu của top SP để làm thanh tiến trình (progress bar)
    const maxDoanhThuTop = topSanPham.length > 0 ? Math.max(...topSanPham.map(sp => sp.doanhThu)) : 1;

    // ================== HÀM THIẾT KẾ TOOLTIP MÀU ĐEN (Theo yêu cầu) ==================
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Tùy chỉnh chữ hiển thị dựa trên chế độ xem biểu đồ (Ngày/Tuần/Tháng)
            let tienTo = "Ngày ";
            if (cheDoBieuDo === 'tuan') tienTo = "Tuần ";
            if (cheDoBieuDo === 'thang') tienTo = "Tháng ";

            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: '#111827',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <p style={{ margin: 0, color: '#9CA3AF' }}>{`${tienTo} ${label}`}</p>
                    <p style={{ margin: "4px 0 0 0", fontWeight: 'bold', fontSize: '15px' }}>
                        {formatTien(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };
    // ===================================================================================
    // ================== HÀM XUẤT EXCEL ==================
    const xuatExcel = () => {
        // 1. Tạo dữ liệu cho Sheet Tổng Quan KPI
        const duLieuTongQuan = [
            { "Chỉ số": "Doanh thu tổng", "Giá trị": tongQuan.doanhThu, "Đơn vị": "VNĐ" },
            { "Chỉ số": "Tổng số đơn hàng", "Giá trị": tongQuan.tongDonHang, "Đơn vị": "Đơn" },
            { "Chỉ số": "Giá trị trung bình/đơn", "Giá trị": tongQuan.giaTriTB, "Đơn vị": "VNĐ" },
            { "Chỉ số": "Tỷ lệ hủy", "Giá trị": tongQuan.tyLeHuy, "Đơn vị": "%" }
        ];

        // 2. Tạo dữ liệu cho Sheet Biểu Đồ Doanh Thu
        const duLieuBieuDo = dataBieuDo.map((item, index) => ({
            "STT": index + 1,
            "Thời gian": item.nhom,
            "Doanh Thu (VNĐ)": item.doanhThu
        }));

        // 3. Khởi tạo file Excel
        const workbook = XLSX.utils.book_new();

        // 4. Gắn Sheet Tổng Quan
        const sheetTongQuan = XLSX.utils.json_to_sheet(duLieuTongQuan);
        XLSX.utils.book_append_sheet(workbook, sheetTongQuan, "Tổng Quan");
        sheetTongQuan["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }];

        // 5. Gắn Sheet Doanh Thu (Nếu có dữ liệu)
        if (duLieuBieuDo.length > 0) {
            const sheetDoanhThu = XLSX.utils.json_to_sheet(duLieuBieuDo);
            XLSX.utils.book_append_sheet(workbook, sheetDoanhThu, "Chi Tiết Doanh Thu");
            sheetDoanhThu["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 20 }];
        }

        // 6. Tải file xuống
        XLSX.writeFile(workbook, `BaoCao_ThongKe_${khoangThoiGian}.xlsx`);
    };

    // ================== HÀM XUẤT PDF ==================
    const xuatPDF = () => {
        // 1. Chọn vùng giao diện muốn chụp thành PDF (Lấy id="vung-xuat-pdf" bọc ngoài nội dung)
        const phanTuHTML = document.getElementById("vung-xuat-pdf");

        // 2. Cấu hình file PDF
        const tuyChon = {
            margin: 0.5,
            filename: `BaoCao_ThongKe_${khoangThoiGian}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, // scale: 2 giúp ảnh nét hơn
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } // landscape: nằm ngang vì biểu đồ rộng
        };

        // 3. Thực thi xuất file
        html2pdf().set(tuyChon).from(phanTuHTML).save();
    };


    return (
        <div className="tk-container">
            {/* HEADER */}
            <div className="tk-header">
                <div>
                    <h2 className="tk-title">Báo cáo & thống kê</h2>
                    <p className="tk-subtitle">Phân tích tình hình kinh doanh, doanh số và vận hành kho bãi</p>
                </div>
                <div className="tk-actions">
                    <div className="tk-filter-group">
                        <button className={khoangThoiGian === '7ngay' ? 'active' : ''} onClick={() => setKhoangThoiGian('7ngay')}>7 ngày</button>
                        <button className={khoangThoiGian === '30ngay' ? 'active' : ''} onClick={() => setKhoangThoiGian('30ngay')}>30 ngày</button>
                        <button className={khoangThoiGian === 'quynay' ? 'active' : ''} onClick={() => setKhoangThoiGian('quynay')}>Quý này</button>
                        <button className={khoangThoiGian === 'namnay' ? 'active' : ''} onClick={() => setKhoangThoiGian('namnay')}>Năm nay</button>
                    </div>
                    <button className="dashboard-btn-export" onClick={xuatExcel}>
                        <i className='bx bx-spreadsheet'></i> Xuất Excel
                    </button>
                    <button className="dashboard-btn-export" onClick={xuatPDF}>
                        <i className='bx bxs-file-pdf'></i> Xuất PDF
                    </button>
                </div>
            </div>

            <div id="vung-xuat-pdf">
                {/* HÀNG 1: 4 KPI TỔNG QUAN */}
                <div className="tk-kpi-grid">
                    <div className="tk-kpi-card">
                        <div className="tk-kpi-top">
                            <span className="tk-kpi-label">Doanh thu tổng</span>
                            <div className="tk-kpi-icon icon-blue"><i className='bx bx-wallet'></i></div>
                        </div>
                        <h3 className="tk-kpi-value">{formatTien(tongQuan.doanhThu)}</h3>
                        <div className="tk-kpi-bottom">
                            {renderPhanTram(tongQuan.doanhThuThayDoi)} <span className="tk-kpi-compare">so với kỳ trước</span>
                        </div>
                    </div>

                    <div className="tk-kpi-card">
                        <div className="tk-kpi-top">
                            <span className="tk-kpi-label">Tổng đơn hàng</span>
                            <div className="tk-kpi-icon icon-yellow"><i className='bx bx-package'></i></div>
                        </div>
                        <h3 className="tk-kpi-value">{formatSo(tongQuan.tongDonHang)}</h3>
                        <div className="tk-kpi-bottom">
                            {renderPhanTram(tongQuan.tongDonHangThayDoi)} <span className="tk-kpi-compare">so với kỳ trước</span>
                        </div>
                    </div>

                    <div className="tk-kpi-card">
                        <div className="tk-kpi-top">
                            <span className="tk-kpi-label">Giá trị trung bình</span>
                            <div className="tk-kpi-icon icon-purple"><i className='bx bx-receipt'></i></div>
                        </div>
                        <h3 className="tk-kpi-value">{formatTien(tongQuan.giaTriTB)}</h3>
                        <div className="tk-kpi-bottom">
                            {renderPhanTram(tongQuan.giaTriTBThayDoi)} <span className="tk-kpi-compare">so với kỳ trước</span>
                        </div>
                    </div>

                    <div className="tk-kpi-card">
                        <div className="tk-kpi-top">
                            <span className="tk-kpi-label">Tỷ lệ hủy</span>
                            <div className="tk-kpi-icon icon-red"><i className='bx bx-error-alt'></i></div>
                        </div>
                        <h3 className="tk-kpi-value">{tongQuan.tyLeHuy.toFixed(1)}%</h3>
                        <div className="tk-kpi-bottom">
                            {tongQuan.tyLeHuyThayDoi <= 0
                                ? <span className="tk-badge-tang"><i className="bx bx-trending-down"></i> {tongQuan.tyLeHuyThayDoi.toFixed(1)}%</span>
                                : <span className="tk-badge-giam"><i className="bx bx-trending-up"></i> +{tongQuan.tyLeHuyThayDoi.toFixed(1)}%</span>}
                            <span className="tk-kpi-compare">so với kỳ trước</span>
                        </div>
                    </div>
                </div>

                {/* HÀNG 2: BIỂU ĐỒ DOANH THU  */}
                <div className="tk-chart-section">
                    <div className="tk-chart-header" style={{ marginBottom: '30px' }}>
                        <div>
                            <h3 className="tk-chart-header-dt" >Doanh thu thực tế</h3>
                            <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
                                Doanh số bán lẻ (VND)
                            </div>
                        </div>
                        <div className="tk-filter-group sm">
                            <button className={cheDoBieuDo === 'ngay' ? 'active' : ''} onClick={() => setCheDoBieuDo('ngay')}>Ngày</button>
                            <button className={cheDoBieuDo === 'tuan' ? 'active' : ''} onClick={() => setCheDoBieuDo('tuan')}>Tuần</button>
                            <button className={cheDoBieuDo === 'thang' ? 'active' : ''} onClick={() => setCheDoBieuDo('thang')}>Tháng</button>
                        </div>
                    </div>

                    <div className="tk-chart-body" style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataBieuDo} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="nhom" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />

                                {/* Ẩn trục Y như yêu cầu của bạn */}
                                <YAxis hide={true} />

                                {/* Áp dụng CustomTooltip */}
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }} />

                                <Line
                                    type="linear"
                                    dataKey="doanhThu"
                                    stroke="#2563EB"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#111827", stroke: "#fff", strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* HÀNG 3: TOP SẢN PHẨM & HIỆU QUẢ KHUYẾN MÃI */}
                <div className="tk-grid-2-cols">
                    {/* 3.1 TOP SẢN PHẨM */}
                    <div className="tk-card">
                        <div className="tk-card-header">
                            <h3>Top sản phẩm bán chạy</h3>
                            <a href="#xem-chi-tiet">Xem chi tiết</a>
                        </div>
                        <table className="tk-table">
                            <thead>
                                <tr>
                                    <th>Hạng</th>
                                    <th>Sản phẩm</th>
                                    <th>Doanh thu</th>
                                    <th style={{ textAlign: 'right' }}>Tỷ lệ thị phần</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSanPham.map((sp, index) => (
                                    <tr key={sp.maSP}>
                                        <td className="tk-rank text-blue">#{index + 1}</td>
                                        <td className="tk-product-name">{sp.tenSP}</td>
                                        <td><strong>{formatTien(sp.doanhThu)}</strong></td>
                                        <td style={{ width: '120px' }}>
                                            <div className="tk-progress-bar">
                                                <div className="tk-progress-fill" style={{ width: `${(sp.doanhThu / maxDoanhThuTop) * 100}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 3.2 HIỆU QUẢ KHUYẾN MÃI */}
                    <div className="tk-card">
                        <div className="tk-card-header">
                            <h3>Hiệu quả khuyến mãi</h3>
                            <a href="#chi-tiet">Chi tiết chiến dịch</a>
                        </div>
                        <table className="tk-table">
                            <thead>
                                <tr>
                                    <th>Chiến dịch</th>
                                    <th>Đơn hàng</th>
                                    <th>Doanh thu</th>
                                    <th style={{ textAlign: 'right' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hieuQuaKM.map((km) => (
                                    <tr key={km.maKM}>
                                        <td className="tk-product-name">{km.tenKM}</td>
                                        <td className="text-gray">{formatSo(km.soDon)} đơn</td>
                                        <td><strong>{formatTien(km.doanhThu)}</strong></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className={`tk-status-badge st-${km.trangThaiBat ? 'dangchay' : 'hoantat'}`}>
                                                {km.trangThaiBat ? "Đang chạy" : "Hoàn tất"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* HÀNG 4: TỒN KHO CẦN NHẬP */}
                <div className="tk-card mt-20">
                    <div className="tk-card-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className='bx bx-archive-in text-blue'></i> Tồn kho cần nhập gấp
                        </h3>
                        <a href="#tao-phieu">Tạo danh sách yêu cầu hàng loạt</a>
                    </div>
                    <table className="tk-table full-width">
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>Hãng / Danh mục</th>
                                <th>Tồn kho hiện tại</th>
                                <th>Ngưỡng tối thiểu</th>
                                <th style={{ textAlign: 'right' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tonKho.map((sp) => (
                                <tr key={sp.maSP}>
                                    <td><img src={sp.hinhAnh} alt="" className="tk-img-sm" /></td>
                                    <td><strong>{sp.tenSP}</strong></td>
                                    <td className="text-gray">
                                        <div style={{ color: '#0f172a', fontWeight: '500' }}>{sp.tenThuongHieu}</div>
                                        <div style={{ fontSize: '12px' }}>{sp.tenLSP}</div>
                                    </td>
                                    <td>
                                        {sp.tonKho} chiếc
                                        <span className="tk-badge-alert ml-10">
                                            {sp.tonKho === 0 ? "Đã hết hàng" : "Sắp hết"}
                                        </span>
                                    </td>
                                    <td className="text-gray">{sp.nguongToiThieu} chiếc</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="tk-btn-action">Tạo phiếu nhập</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ThongKe;