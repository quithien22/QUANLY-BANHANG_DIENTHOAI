import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import axios from 'axios';
 

function Header() {
  // Đã lấy được dữ liệu người dùng ở đây
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const location = useLocation();

  // SU LY O TIM KIEM
  const [tuKhoa, setTuKhoa] = useState("");
  const navigate = useNavigate();

  const xuLyTimKiem = (e) => {
    e.preventDefault();
    navigate(`/home/tim-kiem?q=${tuKhoa}`);
  };

  // ============== SỐ LƯỢNG SẢN PHẨM TRONG GIỎ (lấy thật từ API) ===========
  // Trước đây hard-code "3 Sản phẩm" trong JSX -> giờ tự tải theo maKH
  const [soLuongGioHang, setSoLuongGioHang] = useState(0);

  const taiSoLuongGioHang = () => {
    if (!userData?.maKH) {
      setSoLuongGioHang(0);
      return;
    }
    axios.get(`http://localhost:8080/api/giohang/${userData.maKH}`)
      .then((response) => {
        // Tổng số lượng (cộng dồn số lượng từng dòng), không phải số dòng
        const tongSoLuong = response.data.reduce((tong, item) => tong + (Number(item.soLuong) || 0), 0);
        setSoLuongGioHang(tongSoLuong);
      })
      .catch((error) => console.error("Lỗi khi lấy số lượng giỏ hàng:", error));
  };

  useEffect(() => {
    taiSoLuongGioHang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.maKH]);

    // Khi trang khác (chi tiết sản phẩm, giỏ hàng...) thêm/sửa/xóa giỏ hàng,
  // chúng phát sự kiện "gioHangCapNhat" để Header tải lại số lượng ngay
  useEffect(() => {
    const capNhat = () => taiSoLuongGioHang();
    window.addEventListener("gioHangCapNhat", capNhat);
    return () => window.removeEventListener("gioHangCapNhat", capNhat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.maKH]);

  const navItems = [
    { id: 1, label: "Trang chủ", href: "/home" },
    { id: 2, label: "Apple  ", href: "/home/hang/Apple" },
    { id: 3, label: "Samsung  ", href: "/home/hang/Samsung" },
    { id: 4, label: "Xiaomi  ", href: "/home/hang/Xiaomi" },
    { id: 5, label: "Phụ kiện Công nghệ", href: "/home/hang/Khác" },
    { id: 6, label: "Tin công nghệ", href: "/home/tin-cong-nghe" },
    { id: 7, label: "Khuyến mãi HOT", href: "/home/san-pham-khuyen-mai", highlight: true },
  ];

  const isActive = (href) => location.pathname === href;

  // XU LY NUT ENTER
    const xuLyEnter = ()=> {
      console.log("Tìm kiếm với nút enter", tuKhoa);
    }

    const xuLyPhimEnter = (e) => {
      if (e.key === 'Enter'){
        xuLyEnter();
      }
    }

  return (
    <div className='header'>
      {/* TOP BAR */}
      <div className='top-bar'>
        <div className='top-bar-title'>
          <i className="bx bx-gift" />
          Chào mừng đến với ThienStore – Mua sắm thông minh, tiết kiệm hơn mỗi ngày!
        </div>
        <div className='top-bar-contact'>
          <ul>
            <li>Hotline: 0981918724</li>
            <li>Hệ thống cửa hàng</li>
          </ul>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className='main-header'>
        {/* LOGO */}
        <div className='main-header-logo'>
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL29PuACx7QYeWoXL21gEuHj6vp7ftPETpGlEDtWkDPQ&s=10" alt="ThienStore Logo" />
          <div className='main-header-logo_title' onClick={() => window.location.href = '/home'}>
            <span className='main-header-logo-title-name'>THIỆNSTORE</span>
            <br />
            <span className='main-header-logo-title-n'>Chính hãng giá tốt</span>
          </div>
        </div>

        {/* SEARCH */}
        <form className='main-header-search-form' onSubmit={xuLyTimKiem}>
            <div className='main-header-search'>
              <input type="text"
                placeholder='Bạn tìm điện thoại, phụ kiện gì hôm nay...'
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)} 
                onKeyDown={xuLyPhimEnter}/>
              <button><i className="bx bx-search-big" /></button>
            </div>
          </form>

        {/* ACTIONS */}
        <div className='header-action'>
          <ul>
            <Link to="/home/don-hang">
              <li className='action-item header-action_donhang'>
                <i className="bx bx-package" />
                <div>
                  <span className='action-item-span1 action-item-mau'>Tra cứu </span><br />
                  <span className='action-item-span2  action-item-span2_mau'>Đơn hàng</span>
                </div>
              </li>
            </Link>

            <Link to="/home/themgiohang">
              <li className='action-item header-action_giohang'>
                <i className="bx bx-cart-alt" />
                <div>
                  <span className='action-item-span1'> Giỏ hàng </span><br />
                  <span className='action-item-span2 action-item-sanpham'>{soLuongGioHang} Sản phẩm</span>
                </div>
              </li>
            </Link>

            {/* ----- KHU VỰC ĐĂNG NHẬP ĐÃ ĐƯỢC CẬP NHẬT LOGIC ----- */}
            <li className='action-item header-action_dangnhap'>
              <i className="bx bx-user" />
              <div>
                <span className='action-item-span1 action-item-mau'>Xin chào,</span><br />
                <span className='action-item-span2 action-item-span2_mau'>

                  {userData.hoTen ? (
                    <Link to="/home/tai-khoan">
                      {userData.hoTen}
                    </Link>
                  ) : (
                    <Link to="/login">Đăng nhập</Link>
                  )}

                </span>
              </div>
            </li>


          </ul>
        </div>
      </div>

      {/* NAV-BAR */}
      <nav className="nav-bar">
        <ul>
          {navItems.map(item => (
            <li key={item.id} className={item.highlight ? "nav-highlight" : ""}>
              <Link
                to={item.href}
                className={isActive(item.href) ? "active" : ""}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Header;