// // file: controllers/user/ChatbotController.js
// // Đọc req, gọi Service, trả JSON. Không viết nghiệp vụ ở đây.
// const BaseController = require('../BaseController');

// class ChatbotController extends BaseController {
//     constructor(chatbotService) {
//         super();
//         this.chatbotService = chatbotService;
//     }

//     // POST /api/ai-chat   body: { tinNhan }   -> { success, reply, sanPham }
//     hoi = this.handle(async (req, res) => {
//         const ketQua = await this.chatbotService.hoi(req.body?.tinNhan);
//         res.status(200).json({ success: true, ...ketQua });
//     }, "Lỗi chatbot", { serverMessage: "Chatbot đang bận, vui lòng thử lại sau!" });
// }

// module.exports = ChatbotController;
