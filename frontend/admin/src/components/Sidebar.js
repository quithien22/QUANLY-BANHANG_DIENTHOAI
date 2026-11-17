import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; 

// 1. Định nghĩa mã chức vụ
const QUYEN = {
    GIAM_DOC: 'CV01',
    QUAN_LY: 'CV02',
    NHAN_VIEN: 'CV03'
};

// 2. Mảng cấu hình Menu chứa danh sách quyền được phép xem
const MENU_CONFIG = [
    { id: 1, title: "Dashboard", icon: "bx bx-grid-alt", path: "/admin/dashboard", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN] },
    { id: 2, title: "Quản lý sản phẩm", icon: "bx bx-box", path: "/admin/san_pham", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN] },
    { id: 3, title: "Danh mục sản phẩm", icon: "bx bx-folder", path: "/admin/danh-muc", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY] },
    { id: 4, title: "Quản lý đơn hàng", icon: "bx bx-cart", path: "/admin/quan_ly_don_hang", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN] },
    { id: 5, title: "Khách hàng", icon: "bx bx-group", path: "/admin/khach_hang", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY] },
    { id: 6, title: "Nhân viên & phân quyền", icon: "bx bx-shield-quarter", path: "/admin/nhan_vien_phan_quyen", allowedRoles: [QUYEN.GIAM_DOC] }, // Chỉ Giám đốc
    { id: 7, title: "Nhà cung cấp & nhập hàng", icon: "bx bx-truck", path: "/admin/nhacungcap_phieunhap", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY] },
    { id: 8, title: "Khuyến mãi & Flash Sale", icon: "bx bx-purchase-tag-alt", path: "/admin/khuyen_mai", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY] },
    { id: 9, title: "Đánh giá sản phẩm", icon: "bx bx-star", path: "/admin/danh_gia", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN] },
    { id: 10, title: "Đổi trả hàng", icon: "bx bx-refresh", path: "/admin/doi_tra_hang", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN] },
    { id: 11, title: "Vận chuyển", icon: "bx bx-send", path: "/admin/van_chuyen", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN] },
    { id: 12, title: "Báo cáo & thống kê", icon: "bx bx-bar-chart-alt-2", path: "/admin/thong_ke", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY] },
    { id: 13, title: "Chấm công & lương", icon: "bx bx-calendar", path: "/admin/cham_cong", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY]}, 
    { id: 14, title: "Quản lý banner", icon: "bx bx-brush-sparkles", path: "/admin/banner", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY]}, 
    { id: 15, title: "Quản lý hỗ trợ", icon: "bx bx-message-circle-question-mark", path: "/admin/ho_tro", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY]},    
    { id: 16, title: "Cài đặt hệ thống", icon: "bx bx-cog", path: "/admin/cai_dat_he_thong", allowedRoles: [QUYEN.GIAM_DOC, QUYEN.QUAN_LY, QUYEN.NHAN_VIEN]}, 
]; 
function Sidebar() {
    const location = useLocation(); // Dùng để soi URL hiện tại làm hiệu ứng active màu xanh

    // 1. Lấy thông tin chức vụ người đang đăng nhập
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    const userRole = adminData.maCV || QUYEN.NHAN_VIEN; // Nếu không có dữ liệu, mặc định gán quyền thấp nhất an toàn

    // 2. Lọc ra những Menu mà userRole này được phép xem
    const menuDuocPhepXem = MENU_CONFIG.filter(item => item.allowedRoles.includes(userRole));

    return (
        <div className="sidebar-menu"> {/* Đổi thành sidebar-menu cho khớp CSS */}
            <div className="sidebar-logo">
                <div className="sidebar-logo_icon">T</div>
                <span>6EA Admin</span>
            </div>

            <ul className="sidebar-menu-list" style={{ listStyle: 'none', padding: 0 }}>
                {menuDuocPhepXem.map((menu) => {
                    const isActive = location.pathname.includes(menu.path);

                    return (
                        <li key={menu.id} className="sidebar-item">
                            {/* Chuyển class active vào đây để CSS nhận diện đúng hiệu ứng */}
                            <Link to={menu.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                                <i className={menu.icon}></i>
                                <span>{menu.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default Sidebar;

 