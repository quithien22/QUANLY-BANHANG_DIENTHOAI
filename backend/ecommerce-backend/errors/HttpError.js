// file: errors/HttpError.js
// Lỗi nghiệp vụ có kèm mã HTTP. Service ném ra, BaseController bắt và trả JSON.
// VD: throw new HttpError(401, "Mật khẩu không chính xác!");
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

module.exports = HttpError;
