import React, { useState, useEffect } from "react";
import { contentApi } from "../../API/ContentApi";
import "./tincongnghe.css";
import { Link } from "react-router-dom";

function TinCongNghe() {
    const [danhMucFAQ, setDanhMucFAQ] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [openQuestion, setOpenQuestion] = useState(null);

    useEffect(() => {
        contentApi.getFaq()
            .then(data => {
                setDanhMucFAQ(data);
                if (data.length > 0) {
                    setActiveTab(data[0].maDanhMuc);
                }
            })
            .catch(err => console.error("Lỗi tải FAQ:", err));
    }, []);

    const toggleQuestion = (maCauHoi) => {
        if (openQuestion === maCauHoi) {
            setOpenQuestion(null);
        } else {
            setOpenQuestion(maCauHoi);
        }
    };

    const danhMucHienTai = danhMucFAQ.find(dm => dm.maDanhMuc === activeTab);

    return (
        <div className="faq-container">
            {/* Breadcrumb */}
            <div className="breadcrumb">
                <Link to="/home"> 
                    <span className="breadcrumb-link">Trang chủ</span>
                </Link>
                <i className="bx bx-chevron-right" />
                <span className="breadcrumb-current">Trợ giúp & Tin tức công nghệ</span>
            </div>
 

            {/* PHẦN FAQ / TIN TỨC ĐỘNG TỪ DATABASE */}
            <div className="faq-layout">
                <div className="faq-sidebar">
                    {danhMucFAQ.map(dm => (
                        <button 
                            key={dm.maDanhMuc}
                            className={`sidebar-btn ${activeTab === dm.maDanhMuc ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(dm.maDanhMuc);
                                setOpenQuestion(null);
                            }}
                        >
                            {dm.tenDanhMuc}
                        </button>
                    ))}
                </div>

                <div className="faq-content">
                    {danhMucHienTai && danhMucHienTai.cauHoiList.length > 0 ? (
                        danhMucHienTai.cauHoiList.map(ch => (
                            <div className="faq-item" key={ch.maCauHoi}>
                                <div 
                                    className="faq-question" 
                                    onClick={() => toggleQuestion(ch.maCauHoi)}
                                >
                                    <h4>{ch.cauHoi}</h4>
                                    <i className={`bx ${openQuestion === ch.maCauHoi ? 'bx-chevron-up' : 'bx-chevron-down'}`} />
                                </div>
                                
                                {/* NỘI DUNG MỞ RỘNG (BAO GỒM ẢNH, CHỮ, LINK) */}
                                {openQuestion === ch.maCauHoi && (
                                    <div className="faq-answer">
                                        {/* 1. Hiển thị ẢNH nếu có */}
                                        {ch.anhLienQuan && (
                                            <img 
                                                src={ch.anhLienQuan} 
                                                alt={ch.cauHoi} 
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '400px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    marginBottom: '15px'
                                                }}
                                            />
                                        )}

                                        {/* 2. Hiển thị TEXT trả lời (dùng whiteSpace để nhận diện xuống dòng) */}
                                        <p style={{ whiteSpace: 'pre-line' }}>{ch.traLoi}</p>

                                        {/* 3. Hiển thị NÚT XEM CHI TIẾT nếu có Link */}
                                        {ch.linkLienQuan && (
                                            <div style={{ marginTop: '15px' }}>
                                                <a 
                                                    href={ch.linkLienQuan} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="link-xem-them"
                                                >
                                                    Xem chi tiết bài viết <i className="bx bx-external-link" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="faq-item">
                            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                Đang cập nhật nội dung cho chuyên mục này...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TinCongNghe;