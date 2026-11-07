import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { chatbotApi } from "../../API/ChatbotApi";
import { layUrlAnh } from "../../utils/imageUrl";
import "./chatbotAI.css";


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
        <div className="ai-chatbot-container">
            {/* Nút bật/tắt chat */}
            <button className="ai-chatbot-toggle" onClick={() => setMoChat(!moChat)}>
                {moChat ? "✕" : "💬"}
            </button>

            {/* Khung chat */}
            {moChat && (
                <div className="ai-chatbot-window">
                    <div className="ai-chatbot-header">Chăm sóc khách hàng</div>

                    <div className="ai-chatbot-body">
                        {lichSuChat.map((msg, index) => (
                            <div
                                key={index}
                                className={`ai-chatbot-msg ${msg.sender === "user" ? "ai-chatbot-msg--user" : "ai-chatbot-msg--bot"}`}
                            >
                                {msg.text}
                                {msg.sanPham?.map((sp) => (
                                    <Link
                                        key={sp.maSP}
                                        to={`/home/hang/chi-tiet-san-pham/${sp.maSP}`}
                                        className="ai-chatbot-product"
                                    >
                                        {sp.hinhAnh && (
                                            <img className="ai-chatbot-product-img" src={layUrlAnh(sp.hinhAnh)} alt={sp.tenSP} />
                                        )}
                                        <div>
                                            <div className="ai-chatbot-product-name">{sp.tenSP}</div>
                                            <div className="ai-chatbot-product-price">{Number(sp.giaBan).toLocaleString("vi-VN")}đ</div>
                                            <div className="ai-chatbot-product-link">Xem chi tiết</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}
                        {dangGo && <div className="ai-chatbot-typing">AI đang nghĩ...</div>}
                        <div ref={cuoiKhungChat} />
                    </div>

                    <div className="ai-chatbot-input-bar">
                        <input
                            className="ai-chatbot-input"
                            type="text"
                            value={tinNhanInput}
                            onChange={(e) => setTinNhanInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && guiTinNhan()}
                            placeholder="Nhập câu hỏi..."
                        />
                        <button className="ai-chatbot-send" onClick={guiTinNhan}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiChatbot;
