import React from 'react';
import { paymentApi } from '../../../API/PaymentApi';

function NutThanhToanMoMo({ tongTien, maDonHang }) {

    const xuLyThanhToan = async () => {
        try {
            // Gọi API Backend vừa tạo
            const data = await paymentApi.createMomo({
                amount: tongTien, // VD: 50000
                orderId: maDonHang // VD: "DH123456"
            });

            // Nếu thành công, MoMo sẽ trả về một đường link tên là payUrl
            if (data && data.payUrl) {
                // Tự động chuyển hướng trình duyệt của khách sang trang quét mã QR của MoMo
                window.location.href = data.payUrl;
            }
        } catch (error) {
            console.error("Lỗi khi kết nối thanh toán MoMo:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại sau!");
        }
    };

    return (
        <button 
            className="btn-momo-payment" 
            onClick={xuLyThanhToan}
            style={{ backgroundColor: '#A50064', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
            Thanh toán bằng Ví MoMo
        </button>
    );
}

export default NutThanhToanMoMo;