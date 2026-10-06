import React, {useState, useEffect} from "react";
import "./spnoibat.css";
import axios from "axios";
import { Link } from "react-router-dom";



function SanPhamNoiBat() {
    
// DANH SACH THUONG HIEU 
  const [danhSachThuongHieu, setdanhSachThuongHieu] = useState([]);

  axios.get("http://localhost:8080/api/user/danhmuc")
    .then((response) => {
        const danhSachHienThi = response.data.filter(item => item.trangThai === 1 || item.trangThai === true);
        setdanhSachThuongHieu(danhSachHienThi);
    })
    .catch((error) => console.error("Lỗi:", error));
 

return (
  <div className="spnoibat">
        <span className="spnoibat-title">DANH MỤC NỔI BẬT</span>
        <div className="spnoibat-list">
            {danhSachThuongHieu.map((th, i) => 
                <div key={i} className="spnoibat-item">
                    <Link to={`/home/hang//${th.tenThuongHieu}`}>
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