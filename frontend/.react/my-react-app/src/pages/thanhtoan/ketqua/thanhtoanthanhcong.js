import React, { useEffect, useState } from "react";
import { paymentApi } from "../../../API/PaymentApi";
import { useSearchParams, useNavigate } from "react-router-dom";

// Trang MoMo chuyển khách về sau khi thanh toán (redirectUrl)
// Gửi các tham số trên URL lên backend để kiểm tra chữ ký rồi mới báo kết quả
function ThanhToanThanhCong() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [trangThai, setTrangThai] = useState("dang_kiem_tra"); // dang_kiem_tra | thanh_cong | that_bai | loi
    const [thongBao, setThongBao] = useState("");
    const [maHoaDon, setMaHoaDon] = useState("");

    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries());

        if (!params.orderId) {
            navigate("/home", { replace: true });
            return;
        }

        paymentApi.confirmMomo(params)
            .then((data) => {
                setMaHoaDon(data.maHoaDon);
                setTrangThai(data.thanhCong ? "thanh_cong" : "that_bai");
                setThongBao(data.message || "");
            })
            .catch((err) => {
                console.error("Lỗi xác nhận thanh toán MoMo:", err);
                setTrangThai("loi");
                setThongBao(err.response?.data?.message || "Không xác nhận được kết quả thanh toán.");
            });
    }, [searchParams, navigate]);

    const noiDung = {
        dang_kiem_tra: { icon: "⏳", mau: "#6B7280", tieuDe: "Đang kiểm tra kết quả thanh toán...", moTa: "" },
        thanh_cong: { icon: "✅", mau: "#16A34A", tieuDe: "Thanh toán thành công!", moTa: `Cảm ơn bạn. Đơn hàng ${maHoaDon} đang được xử lý.` },
        that_bai: { icon: "❌", mau: "#DC2626", tieuDe: "Thanh toán chưa thành công", moTa: `Đơn hàng ${maHoaDon} chưa được thanh toán. ${thongBao}` },
        loi: { icon: "⚠️", mau: "#D97706", tieuDe: "Không xác nhận được giao dịch", moTa: `${thongBao} Nếu đã bị trừ tiền, vui lòng liên hệ cửa hàng.` },
    }[trangThai];

    return (
        <div style={{ maxWidth: 520, margin: "60px auto", padding: 32, textAlign: "center", border: "1px solid #E5E7EB", borderRadius: 12, background: "#fff" }}>
            <div style={{ fontSize: 56 }}>{noiDung.icon}</div>
            <h2 style={{ color: noiDung.mau, margin: "12px 0" }}>{noiDung.tieuDe}</h2>
            {noiDung.moTa && <p style={{ color: "#4B5563" }}>{noiDung.moTa}</p>}
            {trangThai !== "dang_kiem_tra" && (
                <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => navigate("/home")} style={{ padding: "10px 20px", cursor: "pointer", border: "none", borderRadius: 6, background: "#1D4ED8", color: "#fff", fontWeight: "bold" }}>
                        Về trang chủ
                    </button>
                    <button onClick={() => navigate("/home/tai-khoan/lich-su-mua-hang")} style={{ padding: "10px 20px", cursor: "pointer", border: "1px solid #D1D5DB", borderRadius: 6, background: "#fff" }}>
                        Lịch sử mua hàng
                    </button>
                </div>
            )}
        </div>
    );
}

export default ThanhToanThanhCong;
