// file: config/Database.js
// Lớp bọc kết nối SQL Server. Dùng chung cho mọi Service.
const sql = require('mssql');

class Database {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.sql = sql; // để Service lấy kiểu dữ liệu: this.db.sql.VarChar(20)
        this._schemaReady = null;
    }

    // Giữ đúng hành vi cũ: sql.connect(dbConfig) dùng lại pool toàn cục nếu đã có
    async getPool() {
        return sql.connect(this.dbConfig);
    }

    // Thêm các cột mới mà code cần (idempotent, chạy 1 lần cho mỗi lần khởi động server).
    //  - GioHang.hetHanLuc      : thời điểm hết hạn giữ hàng 15 phút
    //  - GioHang.dsMaBienThe    : TẤT CẢ biến thể đã chọn (dung lượng + màu), cách nhau dấu phẩy.
    //                             Cột maBienThe cũ chỉ chứa được 1 mã nên giữ lại làm biến thể đầu tiên.
    //  - ChiTietHoaDon.tenPhanLoai / dsMaBienThe : lưu đủ biến thể khách đã mua (tên hiển thị + danh sách mã)
    // Service nào đụng tới các cột này phải `await this.db.ensureSchema()` trước.
    ensureSchema() {
        if (!this._schemaReady) {
            this._schemaReady = this.getPool()
                .then((pool) => pool.request().query(`
                    IF COL_LENGTH('GioHang', 'hetHanLuc') IS NULL
                    BEGIN
                        ALTER TABLE GioHang ADD hetHanLuc DATETIME NULL;
                        -- Các dòng giỏ cũ chưa từng bị trừ kho -> xóa đi, nếu không lúc hết hạn sẽ "hoàn" kho ảo
                        EXEC('DELETE FROM GioHang');
                    END

                    IF COL_LENGTH('GioHang', 'dsMaBienThe') IS NULL
                        ALTER TABLE GioHang ADD dsMaBienThe VARCHAR(100) NULL;

                    IF COL_LENGTH('ChiTietHoaDon', 'tenPhanLoai') IS NULL
                        ALTER TABLE ChiTietHoaDon ADD tenPhanLoai NVARCHAR(200) NULL;

                    IF COL_LENGTH('ChiTietHoaDon', 'dsMaBienThe') IS NULL
                        ALTER TABLE ChiTietHoaDon ADD dsMaBienThe VARCHAR(100) NULL;
                `))
                .catch((err) => {
                    this._schemaReady = null; // lần sau thử lại
                    throw err;
                });
        }
        return this._schemaReady;
    }
}

module.exports = Database;
