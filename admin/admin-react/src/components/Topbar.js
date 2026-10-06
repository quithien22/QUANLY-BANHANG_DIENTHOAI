import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Topbar.css";


function Topbar() {
    const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
    const navigate = useNavigate();

    // 1. Danh sách các menu dựa trên giao diện thực tế
    const danhSachMenu = [
        { name: "Dashboard", path: "/admin" },
        { name: "Quản lý sản phẩm", path: "/admin/san_pham" },
        { name: "Danh mục sản phẩm", path: "/admin/danh_muc" },
        { name: "Quản lý đơn hàng", path: "/admin/quan_ly_don_hang" },
        { name: "Khách hàng", path: "/admin/khach_hang" },
        { name: "Nhân viên & phân quyền", path: "/admin/nhan_vien_phan_quyen" },
        { name: "Nhà cung cấp & nhập hàng", path: "/admin/nhacungcap_phieunhap" },
        { name: "Khuyến mãi & Flash Sale", path: "/admin/khuyen_mai" },
        { name: "Đánh giá sản phẩm", path: "/admin/danh_gia" },
        { name: "Đổi trả hàng", path: "/admin/doi_tra_hang" },
        { name: "Vận chuyển", path: "/admin/van_chuyen" },
        { name: "Báo cáo & thống kê", path: "/admin/thong_ke" },
        { name: "Chấm công & lương", path: "/admin/cham_cong" },
        { name: "Quản lý banner", path: "/admin/banner" },
        { name: "Quản lý hỗ trợ", path: "/admin/ho_tro" },
        { name: "Cài đặt hệ thống", path: "/admin/cai_dat_he_thong" }
    ];

    // 2. State quản lý tìm kiếm
    const [tuKhoa, setTuKhoa] = useState("");
    const [ketQua, setKetQua] = useState([]);
    const [hienThiDropdown, setHienThiDropdown] = useState(false);
    const searchRef = useRef(null);

    // 3. Hàm loại bỏ dấu tiếng Việt để tìm kiếm thông minh hơn (VD: gõ "san pham" vẫn ra "Sản phẩm")
    const xoaDauTiengViet = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // 4. Xử lý khi người dùng gõ vào ô tìm kiếm
    const xuLyTimKiem = (e) => {
        const giaTri = e.target.value;
        setTuKhoa(giaTri);

        if (giaTri.trim() === "") {
            setKetQua([]);
            setHienThiDropdown(false);
            return;
        }

        const tuKhoaKhongDau = xoaDauTiengViet(giaTri);
        const locKetQua = danhSachMenu.filter(menu =>
            xoaDauTiengViet(menu.name).includes(tuKhoaKhongDau)
        );

        setKetQua(locKetQua);
        setHienThiDropdown(true);
    };

    // 5. Chuyển trang khi click vào kết quả
    const chuyenTrang = (path) => {
        navigate(path);
        setTuKhoa("");
        setHienThiDropdown(false);
    };

    // 6. Ẩn dropdown khi click ra ngoài vùng tìm kiếm
    useEffect(() => {
        const handleClickOut = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setHienThiDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOut);
        return () => document.removeEventListener("mousedown", handleClickOut);
    }, []);

    // 7. Hàm phụ dịch mã chức vụ
    const layTenChucVu = (maCV) => {
        switch (maCV) {
            case 'CV01': return "Ban Giám Đốc";
            case 'CV02': return "Quản lý";
            case 'CV03': return "Nhân viên";
            default: return "Quản trị viên";
        }
    };

    return (
        <div className="topbar">
            <ul className="topbar-menu">
                {/* KHU VỰC Ô TÌM KIẾM CÓ DROPDOWN */}
                <li className="topbar-search" ref={searchRef} style={{ position: 'relative' }}>
                    <i className="bx bx-search search-icon" />
                    <input
                        type="search"
                        className="search-input"
                        placeholder="Tìm kiếm nhanh danh mục..."
                        value={tuKhoa}
                        onChange={xuLyTimKiem}
                        onFocus={() => tuKhoa.trim() !== "" && setHienThiDropdown(true)}
                    />

                    {/* MENU DROPDOWN KẾT QUẢ TÌM KIẾM */}
                    {hienThiDropdown && (
                        <div className="search-dropdown">
                            {ketQua.length > 0 ? (
                                ketQua.map((item, index) => (
                                    <div
                                        key={index}
                                        className="search-dropdown-item"
                                        onClick={() => chuyenTrang(item.path)}
                                    >
                                        <i className="bx bx-link" style={{ marginRight: '8px', color: '#64748b' }}></i>
                                        {item.name}
                                    </div>
                                ))
                            ) : (
                                <div className="search-dropdown-empty">
                                    Không tìm thấy danh mục nào.
                                </div>
                            )}
                        </div>
                    )}
                </li>

                <li className="topbar-profile">
                    <i className="bx bx-bell notification-icon" />
                    <Link className="link_cai_dat" to="/admin/cai_dat_he_thong">
                        <div className="user-profile-wrapper">
                            <img
                                src={adminData.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGrWyGajNrjdcvAN_0iP_2NkgvkvP2Wc7KOFaL4n5kcw&s=10"}
                                alt="Avatar"
                                className="user-avatar"
                            />
                            <div className="user-info">
                                <span className="user-name">
                                    {adminData.hoTen || "Người dùng ẩn danh"}
                                </span>

                                <label className="user-role">
                                    {layTenChucVu(adminData.maCV)}
                                </label>


                            </div>
                        </div>
                    </Link>
                </li>
            </ul>
        </div>
    );
}

export default Topbar;