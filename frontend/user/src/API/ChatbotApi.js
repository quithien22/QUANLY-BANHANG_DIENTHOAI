// file: src/API/ChatbotApi.js
// Chatbot AI tư vấn sản phẩm.
import BaseApi from "./BaseApi";

class ChatbotApi extends BaseApi {
    // POST /api/ai-chat
    //   body    : { tinNhan }
    //   trả về  : { success, reply, sanPham: [{ maSP, tenSP, giaBan, hinhAnh }] }
    async ask(tinNhan) {
        const response = await this.client.post("/api/ai-chat", { tinNhan });
        return response.data;
    }
}

export default ChatbotApi;
export const chatbotApi = new ChatbotApi();
