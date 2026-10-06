import React, { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./dashboard_admin.css";

function Dashboard() {
    // 1. Quản lý trạng thái bộ lọc
    const [khoangThoiGian, setKhoangThoiGian] = useState("30ngay");
    const [cheDoBieuDo, setCheDoBieuDo] = useState("ngay"); 

    // 2. State lưu dữ liệu từ API (Chỉ giữ lại những dữ liệu cần thiết)
    const [tongQuan, setTongQuan] = useState({ doanhThu: 0, doanhThuThayDoi: 0, tongDonHang: 0, tongDonHangThayDoi: 0, giaTriTB: 0, giaTriTBThayDoi: 0, tyLeHuy: 0, tyLeHuyThayDoi: 0 });
    const [dataBieuDo, setDataBieuDo] = useState([]);

    // 3. Gọi API lấy dữ liệu tổng quan và biểu đồ
    useEffect(() => {
        const taiDuLieu = async () => {
            try {
                const [tqRes, bdRes] = await Promise.all([
                    axios.get(`http://localhost:8080/api/thongke/tongquan?khoang=${khoangThoiGian}`),
                    axios.get(`http://localhost:8080/api/thongke/doanhthu?khoang=${khoangThoiGian}&theo=${cheDoBieuDo}`)
                ]);

                setTongQuan(tqRes.data);
                setDataBieuDo(bdRes.data);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu thống kê:", error);
            }
        };
        taiDuLieu();
    }, [khoangThoiGian, cheDoBieuDo]);

    // 4. Hàm tiện ích format tiền và hiển thị phần trăm
    const formatTien = (soTien) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(soTien || 0);
    const formatSo = (so) => new Intl.NumberFormat('vi-VN').format(so || 0);
    
    const renderPhanTram = (so) => {
        const value = Number(so).toFixed(1);
        if (value > 0) return <span className="dashboard-badge-tang"><i className="bx bx-trending-up"></i> +{value}%</span>;
        if (value < 0) return <span className="dashboard-badge-giam"><i className="bx bx-trending-down"></i> {value}%</span>;
        return <span className="dashboard-badge-hoa"> 0%</span>;
    };

    // ================== HÀM THIẾT KẾ TOOLTIP MÀU ĐEN ==================
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
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
    // ====================================================================

    return (
        <div className="dashboard-container">
            {/* HEADER */}
            <div className="dashboard-header">
                <div>
                    <h2 className="dashboard-title">Dashboard tổng quan</h2>
                    <p className="dashboard-subtitle">Cập nhật thời gian thực chỉ số vận hành toàn sàn</p>
                </div>
                <div className="dashboard-actions">
                    <div className="dashboard-filter-group">
                        <button className={khoangThoiGian === '7ngay' ? 'active' : ''} onClick={() => setKhoangThoiGian('7ngay')}>7 ngày</button>
                        <button className={khoangThoiGian === '30ngay' ? 'active' : ''} onClick={() => setKhoangThoiGian('30ngay')}>30 ngày</button>
                        <button className={khoangThoiGian === 'quynay' ? 'active' : ''} onClick={() => setKhoangThoiGian('quynay')}>Quý này</button>
                        <button className={khoangThoiGian === 'namnay' ? 'active' : ''} onClick={() => setKhoangThoiGian('namnay')}>Năm nay</button>
                    </div>
          
                </div>
            </div>

            {/* HÀNG 1: 4 KPI TỔNG QUAN */}
            <div className="dashboard-kpi-grid">
                <div className="dashboard-kpi-card">
                    <div className="dashboard-kpi-top">
                        <span className="dashboard-kpi-label">Doanh thu tổng</span>
                        <div className="dashboard-kpi-icon icon-blue"><i className='bx bx-wallet'></i></div>
                    </div>
                    <h3 className="dashboard-kpi-value">{formatTien(tongQuan.doanhThu)}</h3>
                    <div className="dashboard-kpi-bottom">
                        {renderPhanTram(tongQuan.doanhThuThayDoi)} <span className="dashboard-kpi-compare">so với kỳ trước</span>
                    </div>
                </div>

                <div className="dashboard-kpi-card">
                    <div className="dashboard-kpi-top">
                        <span className="dashboard-kpi-label">Tổng đơn hàng</span>
                        <div className="dashboard-kpi-icon icon-yellow"><i className='bx bx-package'></i></div>
                    </div>
                    <h3 className="dashboard-kpi-value">{formatSo(tongQuan.tongDonHang)}</h3>
                    <div className="dashboard-kpi-bottom">
                        {renderPhanTram(tongQuan.tongDonHangThayDoi)} <span className="dashboard-kpi-compare">so với kỳ trước</span>
                    </div>
                </div>

                <div className="dashboard-kpi-card">
                    <div className="dashboard-kpi-top">
                        <span className="dashboard-kpi-label">Giá trị trung bình</span>
                        <div className="dashboard-kpi-icon icon-purple"><i className='bx bx-receipt'></i></div>
                    </div>
                    <h3 className="dashboard-kpi-value">{formatTien(tongQuan.giaTriTB)}</h3>
                    <div className="dashboard-kpi-bottom">
                        {renderPhanTram(tongQuan.giaTriTBThayDoi)} <span className="dashboard-kpi-compare">so với kỳ trước</span>
                    </div>
                </div>

                <div className="dashboard-kpi-card">
                    <div className="dashboard-kpi-top">
                        <span className="dashboard-kpi-label">Tỷ lệ hủy</span>
                        <div className="dashboard-kpi-icon icon-red"><i className='bx bx-error-alt'></i></div>
                    </div>
                    <h3 className="dashboard-kpi-value">{tongQuan.tyLeHuy.toFixed(1)}%</h3>
                    <div className="dashboard-kpi-bottom">
                        {tongQuan.tyLeHuyThayDoi <= 0 
                            ? <span className="dashboard-badge-tang"><i className="bx bx-trending-down"></i> {tongQuan.tyLeHuyThayDoi.toFixed(1)}%</span> 
                            : <span className="dashboard-badge-giam"><i className="bx bx-trending-up"></i> +{tongQuan.tyLeHuyThayDoi.toFixed(1)}%</span>}
                        <span className="dashboard-kpi-compare">so với kỳ trước</span>
                    </div>
                </div>
            </div>

            {/* HÀNG 2: BIỂU ĐỒ DOANH THU */}
            <div className="dashboard-chart-section">
                <div className="dashboard-chart-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 className="dashboard-chart-header-dt" style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111827' }}>Doanh thu thực tế</h3>
                        <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
                            Doanh số bán lẻ (VND)
                        </div>
                    </div>
                    <div className="dashboard-filter-group sm">
                        <button className={cheDoBieuDo === 'ngay' ? 'active' : ''} onClick={() => setCheDoBieuDo('ngay')}>Ngày</button>
                        <button className={cheDoBieuDo === 'tuan' ? 'active' : ''} onClick={() => setCheDoBieuDo('tuan')}>Tuần</button>
                        <button className={cheDoBieuDo === 'thang' ? 'active' : ''} onClick={() => setCheDoBieuDo('thang')}>Tháng</button>
                    </div>
                </div>
                
                <div className="dashboard-chart-body" style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataBieuDo} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="nhom" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                            
                            <YAxis hide={true} />
                            
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
        </div>
    );
}

export default Dashboard;