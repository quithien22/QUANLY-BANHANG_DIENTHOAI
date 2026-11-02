// // file: services/user/ChatbotService.js
// // Chatbot tư vấn bán điện thoại: Gemini trích bộ lọc -> SQL lấy ứng viên -> Gemini chọn máy + trả lời.
// // "Huấn luyện" bằng file kiến thức data/chatbot-train.json (chính sách, bảo hành, thanh toán...).
// const fs = require('fs');
// const path = require('path');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const BaseService = require('../BaseService');
// const HttpError = require('../../errors/HttpError');

// const FILE_KIEN_THUC = path.join(__dirname, '..', '..', 'data', 'chatbot-train.json');

// class ChatbotService extends BaseService {
//     constructor(db) {
//         super(db);
//         const key = process.env.GEMINI_API_KEY;
//         this.model = key
//             ? new GoogleGenerativeAI(key).getGenerativeModel({
//                   model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
//                   generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
//               })
//             : null;
//         this.kienThuc = this.docKienThuc();
//     }

//     // Đọc file kiến thức khi khởi động (sửa file xong cần chạy lại backend)
//     docKienThuc() {
//         try {
//             return JSON.parse(fs.readFileSync(FILE_KIEN_THUC, 'utf8'));
//         } catch (err) {
//             console.warn('Không đọc được data/chatbot-train.json:', err.message);
//             return [];
//         }
//     }

//     async goiJson(prompt) {
//         const ketQua = await this.model.generateContent(prompt);
//         return JSON.parse(ketQua.response.text());
//     }

//     // Lấy các mục kiến thức có nhiều từ trùng với câu hỏi nhất
//     layKienThuc(tinNhan, k = 5) {
//         const tu = tinNhan.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
//         return this.kienThuc
//             .map((m) => {
//                 const noiDung = `${m.cauHoi} ${m.traLoi}`.toLowerCase();
//                 return { m, diem: tu.filter((t) => noiDung.includes(t)).length };
//             })
//             .filter((x) => x.diem > 0)
//             .sort((a, b) => b.diem - a.diem)
//             .slice(0, k)
//             .map((x) => x.m);
//     }

//     async hoi(tinNhan) {
//         if (!this.model) throw new HttpError(500, 'Chưa cấu hình GEMINI_API_KEY trong file .env');
//         if (typeof tinNhan !== 'string' || !tinNhan.trim() || tinNhan.length > 500) {
//             throw new HttpError(400, 'Tin nhắn không hợp lệ');
//         }

//         // Bước 1: trích bộ lọc từ câu chat (lỗi thì bỏ qua, coi như không có bộ lọc)
//         let boLoc = {};
//         try {
//             boLoc = await this.goiJson(
//                 `Trích bộ lọc mua điện thoại từ câu hỏi. Trả JSON: {"giaMax": số VND hoặc null, "giaMin": số VND hoặc null, "hang": tên hãng hoặc null, "nhuCau": [chuỗi]}.\nCâu hỏi: """${tinNhan}"""`
//             );
//         } catch (err) {
//             console.warn('Chatbot - không trích được bộ lọc:', err.message);
//         }

//         // Bước 2: lấy máy ứng viên từ database + kiến thức cửa hàng liên quan
//         const ungVien = await this.timUngVien(boLoc || {});
//         const kienThuc = this.layKienThuc(tinNhan);

//         // Bước 3: AI chọn máy phù hợp và viết câu trả lời
//         const ketQua = await this.goiJson(
//             `Bạn là trợ lý tư vấn của cửa hàng điện thoại ThienStore. Trả lời tiếng Việt, thân thiện, ngắn gọn.\n` +
//             `Quy tắc:\n` +
//             `- Chỉ gợi ý máy khi khách hỏi về sản phẩm; chọn tối đa 3 máy từ DANH SÁCH MÁY, nêu lý do ngắn cho từng máy. Không bịa máy hay thông số.\n` +
//             `- Nếu DANH SÁCH MÁY rỗng hoặc không máy nào phù hợp, nói rõ và hỏi thêm nhu cầu (ngân sách, hãng, mục đích dùng).\n` +
//             `- Với câu hỏi về chính sách, bảo hành, thanh toán, giao hàng: chỉ dùng KIẾN THỨC CỬA HÀNG. Nếu không có thông tin, nói chưa có thông tin và mời khách gọi hotline 0981918724. Không tự bịa chính sách.\n` +
//             `Trả JSON: {"reply": "...", "maSPGoiY": ["maSP", ...]} (maSPGoiY để mảng rỗng nếu không gợi ý máy).\n\n` +
//             `Câu hỏi của khách: """${tinNhan}"""\n` +
//             `KIẾN THỨC CỬA HÀNG: ${JSON.stringify(kienThuc)}\n` +
//             `DANH SÁCH MÁY: ${JSON.stringify(ungVien)}`
//         );

//         // Chỉ nhận các mã nằm trong danh sách ứng viên, tránh AI bịa mã sản phẩm
//         const goiY = new Set(Array.isArray(ketQua.maSPGoiY) ? ketQua.maSPGoiY : []);
//         const sanPham = ungVien
//             .filter((sp) => goiY.has(sp.maSP))
//             .map(({ maSP, tenSP, giaBan, hinhAnh }) => ({ maSP, tenSP, giaBan, hinhAnh }));

//         return { reply: String(ketQua.reply || ''), sanPham };
//     }

//     // Lấy tối đa 15 máy đang bán theo bộ lọc, kèm thông số kỹ thuật
//     async timUngVien(boLoc) {
//         const sql = this.sql;
//         const pool = await this.getPool();
//         const req = pool.request();

//         let where = 'trangThai = 1';
//         if (Number(boLoc.giaMax) > 0) { where += ' AND giaBan <= @giaMax'; req.input('giaMax', sql.BigInt, Number(boLoc.giaMax)); }
//         if (Number(boLoc.giaMin) > 0) { where += ' AND giaBan >= @giaMin'; req.input('giaMin', sql.BigInt, Number(boLoc.giaMin)); }
//         if (typeof boLoc.hang === 'string' && boLoc.hang.trim()) {
//             where += ' AND hang LIKE @hang';
//             req.input('hang', sql.NVarChar(50), `%${boLoc.hang.trim()}%`);
//         }

//         const danhSach = (await req.query(
//             `SELECT TOP 15 maSP, tenSP, giaBan, hinhAnh, hang FROM SanPham WHERE ${where} ORDER BY giaBan DESC`
//         )).recordset;
//         if (danhSach.length === 0) return [];

//         const req2 = pool.request();
//         danhSach.forEach((sp, i) => req2.input(`m${i}`, sql.VarChar(20), sp.maSP));
//         const thongSo = (await req2.query(
//             `SELECT maSP, nhan, giaTri FROM ThongSoKyThuat WHERE maSP IN (${danhSach.map((_, i) => `@m${i}`).join(',')})`
//         )).recordset;

//         return danhSach.map((sp) => ({
//             ...sp,
//             thongSo: thongSo
//                 .filter((t) => t.maSP === sp.maSP)
//                 .map((t) => `${t.nhan}: ${t.giaTri}`)
//                 .join('; '),
//         }));
//     }
// }

// module.exports = ChatbotService;
