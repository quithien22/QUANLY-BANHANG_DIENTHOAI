// file: controllers/BaseController.js
// Lớp cha cho mọi Controller: bọc try/catch chung.
//  - HttpError (lỗi nghiệp vụ) -> trả đúng mã + { success:false, message }
//  - Lỗi khác -> log + trả 500
const HttpError = require('../errors/HttpError');

class BaseController {
    // action: async (req, res) => {...}
    // errorLabel: nhãn in ra console khi lỗi bất ngờ
    // options:
    //   exposeMessage  true  -> "Lỗi Server: <chi tiết>", false -> "Lỗi Server"
    //   serverMessage  chuỗi hoặc (err) => chuỗi: thông điệp 500 tùy chỉnh (ưu tiên hơn exposeMessage)
    //   plainText      true -> trả text thuần thay vì JSON (giữ đúng hành vi của một số route cũ)
    handle(action, errorLabel, options = {}) {
        const { exposeMessage = true, serverMessage, plainText = false } = options;

        return async (req, res) => {
            try {
                await action(req, res);
            } catch (err) {
                if (err instanceof HttpError) {
                    return res.status(err.status).json({ success: false, message: err.message });
                }

                console.error(`${errorLabel}:`, err);

                let message;
                if (typeof serverMessage === 'function') message = serverMessage(err);
                else if (typeof serverMessage === 'string') message = serverMessage;
                else message = exposeMessage ? "Lỗi Server: " + err.message : "Lỗi Server";

                if (plainText) return res.status(500).send(message);
                res.status(500).json({ success: false, message });
            }
        };
    }
}

module.exports = BaseController;
