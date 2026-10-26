import React, {useState, useEffect} from "react";
import "./spnoibat.css";
import { productApi } from "../../../API/ProductApi";
import { Link } from "react-router-dom";



function SanPhamNoiBat() {
    
// DANH SACH THUONG HIEU 
  const [danhSachThuongHieu, setdanhSachThuongHieu] = useState([]);

  useEffect(() => {
    productApi.getActiveBrands()
      .then((data) => {
        const danhSachHienThi = data.filter(item => item.trangThai === 1 || item.trangThai === true);
        setdanhSachThuongHieu(danhSachHienThi);
      })
      .catch((error) => console.error("Lỗi:", error));
  }, []);
 

return (
  <div className="spnoibat">
        <span className="spnoibat-title">DANH MỤC NỔI BẬT</span>
        <div className="spnoibat-list">
            {danhSachThuongHieu.map((th, i) => 
                <div key={i} className="spnoibat-item">
                    <Link to={`/home/hang/${encodeURIComponent(/phụ\s*kiện/i.test(th.tenThuongHieu) ? "Khác" : th.tenThuongHieu)}`}>
                        <img src={th.hinhAnh} alt="" />
                        <span className="spnoibat-item_name">{th.tenThuongHieu}</span>
                    </Link>
                    
                </div>
            )}
        </div>
  </div>
);
}

export default SanPhamNoiBat;