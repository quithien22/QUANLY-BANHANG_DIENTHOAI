
import React from "react";
//import { Link } from 'react-router-dom';
import './support.css';
function Support(){
    return(
          <div className='sp'>
            <div className='sp_title'>
                <div className='sp_title_left'>
                    <ul>
                        <li className='sp_title_left_ten'><h2>ShoppÉ</h2></li>
                        <li>Trung tâm hỗ trợ</li>
                    </ul>
                </div>    
            </div>

            <div className="sp_tk">
                <ul>
                    <li className="sp_tk_title">Xin chào , có thẻ giúp gì cho bạn ?</li>
                    <li className="sp_tk_search">
                        <input type="text" placeholder="Nhập từ khóa cần tìm..." />
                        <i className="bx bx-search"></i>
                    </li>
                </ul>
            </div>

            <div className="sp_dangmuc sp_chung">
                <h2>Danh mục</h2>
                <ul>
                    <li>
                        <img src="https://c7.alamy.com/comp/R9H4N3/promo-icon-application-color-icon-use-vector-good-for-your-app-R9H4N3.jpg" alt="" />
                        Khuyến Mãi & Ưu Đãi
                    </li>
                    <li>
                        <img src="https://img.pikbest.com/illustration/20250228/payment-terminal-icon-with-credit-card-and-money-symbol-design_11563934.jpg!bw800" alt="" />
                        Thanh toán 
                    </li>
                    <li>
                        <img src="https://indochinapost.com/wp-content/uploads/dich-vu-chuyen-phat-nhanh-trong-ngay-luu-y-can-nho-01.png" alt="" />
                        Đơn Hàng & Vận Chuyển
                    </li>
                    <li>
                        <img src="https://chaytudong.com/datafiles/2074588308352155648/2026-07/1784527120-76534456-chinh-sach-doi-tra.png" alt="" />
                        Trả Hàng & Hoàn Tiền
                    </li>
                    
                </ul>
            </div>

            <div className="sp_chtg sp_chung">
                <h2>Câu hỏi thường gặp</h2>
                <ul>
                    <li>[Hoàn trả hàng] Làm cách nào để hoàn trả hàng?</li>
                    <li className="sp_chtg-tt">[Thanh toán] Có thể thanh toán như thế nào?</li>
                </ul>
            </div>

            <div className="sp_lienhe  ">
                <h2>Liên hệ shop nếu cần hỗ trợ</h2>
                <ul>
                    <li>
                        <img src="https://img.icons8.com/color/1200/gmail-new.jpg" alt="" />
                        Liên hệ qua gmail
                    </li>
                    <li > 
                        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTld5n-wUPDpVcX1OHcoPpzerYqJu4W9kvF_3LRttYYOcXyJSGeH6ezAQt-&s=10" alt="" />
                        Liên hệ qua số điện thoại
                    </li>
                </ul>

            </div>
        </div>
    );
}

export default Support;