import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
 

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
            const res = await axios.post("http://localhost:8080/api/ai-chat", {
                tinNhan: tinKhach.text
            });
            
            // Nhận câu trả lời từ AI
            setLichSuChat(prev => [...prev, { sender: "bot", text: res.data.reply }]);
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
                style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#1d4ed8", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}
            >
                <i className={`bx ${moChat ? 'bx-x' : 'bx-message-rounded-dots'}`} style={{ fontSize: "28px" }}></i>
            </button>

            {/* Khung chat */}
            {moChat && (
                <div style={{ position: "absolute", bottom: "75px", right: "0", width: "350px", height: "450px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 5px 25px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "15px", backgroundColor: "#1d4ed8", color: "white", fontWeight: "bold" }}>
                        Trợ lý ảo AI
                    </div>
                    
                    <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8fafc" }}>
                        {lichSuChat.map((msg, index) => (
                            <div key={index} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", backgroundColor: msg.sender === "user" ? "#1d4ed8" : "#e2e8f0", color: msg.sender === "user" ? "white" : "black", padding: "10px 15px", borderRadius: "15px", maxWidth: "80%" }}>
                                {msg.text}
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
                        <button onClick={guiTinNhan} style={{ marginLeft: "10px", background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontSize: "24px" }}>
                            <i className='bx bxs-send'></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiChatbot;