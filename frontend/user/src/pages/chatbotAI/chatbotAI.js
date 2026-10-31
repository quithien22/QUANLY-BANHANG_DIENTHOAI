import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { chatbotApi } from "../../API/ChatbotApi";
import { layUrlAnh } from "../../utils/imageUrl";
 

function AiChatbot() {
    const [moChat, setMoChat] = useState(false);
    const [tinNhanInput, setTinNhanInput] = useState("");
    const [lichSuChat, setLichSuChat] = useState([
        { sender: "bot", text: "Xin chào! Mình là trợ lý AI của cửa hàng. Mình có thể giúp gì cho bạn?" }
    ]);
    const [dangGo, setDangGo] = useState(false);
    const cuoiKhungChat = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        cuoiKhungChat.current?.scrollIntoView({ behavior: "smooth" });
    }, [lichSuChat, dangGo]);

    const guiTinNhan = async () => {
        if (!tinNhanInput.trim()) return;

        // Lưu tin nhắn của khách vào UI
        const tinKhach = { sender: "user", text: tinNhanInput };
        setLichSuChat(prev => [...prev, tinKhach]);
        setTinNhanInput("");
        setDangGo(true);

        try {
            // Gọi API lên Backend Node.js
            const res = await chatbotApi.ask(tinKhach.text);
            
            // Nhận câu trả lời từ AI
            setLichSuChat(prev => [...prev, { sender: "bot", text: res.reply, sanPham: res.sanPham || [] }]);
        } catch (error) {
            setLichSuChat(prev => [...prev, { sender: "bot", text: "Kết nối bị lỗi, vui lòng thử lại sau." }]);
        } finally {
            setDangGo(false);
        }
    };

    return (
        <div className="ai-chatbot-container" style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
            {/* Nút bật/tắt chat */}
            <button 
                onClick={() => setMoChat(!moChat)} 
                style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#1d4ed8", color: "white", border: "none", cursor: "pointer", fontSize: "26px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
            >
                {moChat ? "✕" : "💬"}
            </button>

            {/* Khung chat */}
            {moChat && (
                <div style={{ position: "absolute", bottom: "75px", right: "0", width: "350px", height: "450px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 5px 25px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "15px", backgroundColor: "#1d4ed8", color: "white", fontWeight: "bold" }}>
                        Trợ lý ảo AI
                    </div>
                    
                    <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8fafc" }}>
                        {lichSuChat.map((msg, index) => (
                            <div key={index} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", backgroundColor: msg.sender === "user" ? "#1d4ed8" : "#e2e8f0", color: msg.sender === "user" ? "white" : "black", padding: "10px 15px", borderRadius: "15px", maxWidth: "80%", whiteSpace: "pre-line" }}>
                                {msg.text}
                                {msg.sanPham?.map((sp) => (
                                    <Link
                                        key={sp.maSP}
                                        to={`/home/hang/chi-tiet-san-pham/${sp.maSP}`}
                                        style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px", padding: "8px", backgroundColor: "white", borderRadius: "8px", textDecoration: "none", color: "inherit" }}
                                    >
                                        {sp.hinhAnh && (
                                            <img src={layUrlAnh(sp.hinhAnh)} alt={sp.tenSP} style={{ width: "56px", height: "56px", objectFit: "contain" }} />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{sp.tenSP}</div>
                                            <div style={{ color: "#dc2626", fontSize: "14px" }}>{Number(sp.giaBan).toLocaleString("vi-VN")}đ</div>
                                            <div style={{ color: "#1d4ed8", fontSize: "12px" }}>Xem chi tiết</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}
                        {dangGo && <div style={{ alignSelf: "flex-start", color: "#64748b", fontSize: "13px" }}>AI đang nghĩ...</div>}
                        <div ref={cuoiKhungChat} />
                    </div>

                    <div style={{ display: "flex", padding: "10px", borderTop: "1px solid #e2e8f0" }}>
                        <input 
                            type="text" 
                            value={tinNhanInput} 
                            onChange={(e) => setTinNhanInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && guiTinNhan()}
                            placeholder="Nhập câu hỏi..." 
                            style={{ flex: 1, padding: "10px", border: "1px solid #cbd5e1", borderRadius: "20px", outline: "none" }}
                        />
                        <button onClick={guiTinNhan} style={{ marginLeft: "10px", background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontSize: "22px" }}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiChatbot;