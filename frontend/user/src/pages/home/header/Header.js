import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import { cartApi } from '../../../API/CartApi';
import LogoImages from '../../../images/logo.jpg';


function Header() {
  // Đã lấy được dữ liệu người dùng ở đây
  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const location = useLocation();

  // SU LY O TIM KIEM
  const [tuKhoa, setTuKhoa] = useState("");
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const xuLyTimKiem = (e) => {
    e.preventDefault();
    // encodeURIComponent: từ khóa có &, #, % hoặc dấu cách... không được làm hỏng query string
    const tuKhoaSach = tuKhoa.trim();
    if (!tuKhoaSach) return;
    navigate(`/home/tim-kiem?q=${encodeURIComponent(tuKhoaSach)}`);
  };

  // ============== SỐ LƯỢNG SẢN PHẨM TRONG GIỎ (lấy thật từ API) ===========
  // Trước đây hard-code "3 Sản phẩm" trong JSX -> giờ tự tải theo maKH
  const [soLuongGioHang, setSoLuongGioHang] = useState(0);

  const taiSoLuongGioHang = () => {
    if (!userData?.maKH) {
      setSoLuongGioHang(0);
      return;
    }
    cartApi.getCart(userData.maKH)
      .then((data) => {
        // Tổng số lượng (cộng dồn số lượng từng dòng), không phải số dòng
        const tongSoLuong = data.reduce((tong, item) => tong + (Number(item.soLuong) || 0), 0);
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

  // Chặn cuộn trang khi bấm vào danh mục
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Chặn lăn chuột
    } else {
      document.body.style.overflow = 'unset'; // Cho phép lăn chuột lại
    }

    // Cleanup function để đảm bảo trả lại scroll khi unmount component
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


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
  const xuLyEnter = () => {
    console.log("Tìm kiếm với nút enter", tuKhoa);
  }

  const xuLyPhimEnter = (e) => {
    if (e.key === 'Enter') {
      xuLyEnter();
    }
  }

  return (
    <div className='header'>
      {/* TOP BAR */}
      <div className='top-bar'>
        <div className='top-bar-title'>
          <i className="bx bx-gift" />
          Chào mừng đến với 6AEStore – Mua sắm thông minh, tiết kiệm hơn mỗi ngày!
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
          <img src={LogoImages} alt="" />
          <div className='main-header-logo_title' onClick={() => window.location.href = '/home'}>
            <span className='main-header-logo-title-name'>6AE-STORE</span>
            <br />
            <span className='main-header-logo-title-n'>Chính hãng giá tốt</span>
          </div>
        </div>

        {/* DANH MUC */}
        <div className='danhmuc-wrapper'>
          <div className='main-danhmuc' onClick={() => setIsOpen(!isOpen)}>
            <i className="bx bx-dashboard" />
            <span>Danh Mục</span>
            <i className={`bx bx-chevron-down ${isOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* MODAL DANH MỤC CẤP 1 & CẤP 2 */}
          {isOpen && (
            <>
              <div className="modal-overlay" onClick={() => setIsOpen(false)} />

              <div className='main-moal-danhmuc'>
                <ul>
                  {/* Mục 1: Điện thoại, Tablet */}
                  <li className="has-submenu">
                    <div className="category-item-content">
                      <i className="bx bx-mobile" />
                      <span>Điện thoại, Tablet</span>
                      <i className="bx bx-chevron-right arrow-right" />
                    </div>

                    {/* Submenu cấp 2 xuất hiện khi hover */}
                    <div className="submenu">
                      <div className="submenu-header">Thương hiệu hot</div>
                      <ul>
                        <li>
                          <Link to="/home/hang/Apple" onClick={() => setIsOpen(false)}>
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDkvabTjHlDgMbfMFVU73wHmtnq7FjcBiiKUQfDXEpFxnoUkQh_CdreZLb&s=10" alt="" />
                          </Link>
                        </li>
                        <li>
                          <Link to="/home/hang/Samsung" onClick={() => setIsOpen(false)}>
                            <img src="https://images.samsung.com/is/image/samsung/assets/vn/about-us/brand/logo/mo/256_144_2.png?$512_N_PNG$" alt="" />
                          </Link>
                        </li>
                        <li>
                          <Link to="/home/hang/Xiaomi" onClick={() => setIsOpen(false)}>
                            <img src="https://cellphones.com.vn/sforum/wp-content/uploads/2021/03/Xiaomi-Mi-Logo.jpg" alt="" />
                          </Link>
                        </li>
                        <li>
                          <Link to="/home/hang/Oppo" onClick={() => setIsOpen(false)}>
                              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/OPPO_LOGO_2019.png?utm_source=vi.wikipedia.org&utm_campaign=index&utm_content=original" alt="" />
                          </Link>
                        </li>
                        <li>
                          <Link to="/home/hang/Vivo" onClick={() => setIsOpen(false)}>
                              <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/Vivo_New_Logo_2019.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original" alt="" />
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </li>

                  {/* Mục 2: Phụ kiện */}
                  <li className="has-submenu">
                    <div className="category-item-content">
                      <i className="bx bx-headphone" />
                      <span>Phụ kiện Công nghệ</span>
                      <i className="bx bx-chevron-right arrow-right" />
                    </div>

                    {/* Submenu cấp 2 cho Phụ kiện */}
                    <div className="submenu">
                      <div className="submenu-header">Loại phụ kiện</div>
                      <ul>
                        <li>
                          <Link  to="/home/hang/op-lung" onClick={() => setIsOpen(false)}> 
                              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShOqXRPXANJATLBWJlR_8cfVFItmheQMBR782dNptIJA&s=10" alt="" />
                               
                          </Link>
                        </li>
                        <li>
                          <Link  to="/home/hang/Sac-cap" onClick={() => setIsOpen(false)}>
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSG_QzmdOthqemMkvRqr8HquPW9eNpt1zH9ZVpqJYwbFw&s=10" alt="" />
                             
                          </Link>
                        </li>
                        
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </>
          )}
      </div>
          {/* SEARCH */}
          <form className='main-header-search-form' onSubmit={xuLyTimKiem}>
            <div className='main-header-search'>
              <input type="text"
                placeholder='Bạn tìm điện thoại, phụ kiện gì hôm nay...'
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                onKeyDown={xuLyPhimEnter} />
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