import React from "react";
import "./footer.css";

function ChanTrang() {

    return (
        <div className="footer">
            <ul className="footer-columns">
                <li className="footer-column">
                    <span className="footer-column_title">TỔNG ĐÀI HỖ TRỢ</span>
                    <a href="#" className="footer-column_link">Gọi mua hàng: 
                        <span className="footer-column_link_span">0981918724</span>
                    </a>
                </li>
                <li className="footer-column">
                    <span className="footer-column_title">HỆ THỐNG CỬA HÀNG</span>
                    <a href="#" className="footer-column_link">ThienStore – Hệ thống bán lẻ điện thoại & thiết <br/> bị công nghệ chính hãng hàng đầu Việt Nam.</a>
                    <a href="#" className="footer-column_link footer-column_cuahang">Địa chỉ cửa hàng</a>
                </li>
                <li className="footer-column ">
                    <span className="footer-column_title">CHÍNH SÁCH BÁN HÀNG</span>
                    <a href="#" className="footer-column_link">Giao hàng nhanh miễn phí</a>
                    <a href="#" className="footer-column_link">Chính sách 1-đổi-1</a>
                    <a href="#" className="footer-column_link">Bảo hành chính hãng 12-24 tháng</a>
                    <a href="#" className="footer-column_link">Mua trả góp với lãi suất 0%</a>
                </li>
                <li className="footer-column  ">
                    <span className="footer-column_title">PHƯƠNG THỨC THANH TOÁN</span>
                    <div className="footer-column_pay">
                        <a href="#" className="footer-payment_item">
                            <img className="footer-payment_icon" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnx0FVv6edSh8UAp2IfQw-eebssLMxWarbl7VVAarQaQ&s=10" alt="VNPAY" />
                            <span>VNPAY</span>
                        </a>
                        <a href="#" className="footer-payment_item">
                            <img className="footer-payment_icon" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwDqB4f9dGRekP_Np0y31ZMj365pHwBIAqJGdz0Uhm9A&s=10" alt="Momo" />
                            <span>Momo</span>
                        </a>
                        <a href="#" className="footer-payment_item">
                            <img className="footer-payment_icon" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfYZdXB3DKn7fgNebkx56oLaYJuQA__K_yH7PtJUGOSQ&s=10" alt="ShopeePay" />
                            <span>ShopePay</span>
                        </a>
                        <a href="#" className="footer-payment_item">
                            <img className="footer-payment_icon" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9JAY3J-NeZYxgXGK97VQmyCiyXJbIqDGJ1_Du39HXVg&s=10" alt="COD" />
                            <span>COD</span>
                        </a>
                    </div>
                </li>
            </ul>
            
            <div className="footer-bottom">
                <ul className="footer-bottom_list">
                    <li className="footer-bottom_text">ThienStore. Uy tín mua sắm.</li>
                    <li className="footer-bottom_links">
                        <a href="#">Điều khoản bảo mật</a>
                        <a href="#">Quy chế hoạt động</a>
                    </li>
                </ul>
            </div>
        </div>
    );
}
export default ChanTrang;