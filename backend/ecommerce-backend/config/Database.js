// file: config/Database.js
// Lớp bọc kết nối SQL Server. Dùng chung cho mọi Service.
const sql = require('mssql');

class Database {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.sql = sql; // để Service lấy kiểu dữ liệu: this.db.sql.VarChar(20)
    }

    // Giữ đúng hành vi cũ: sql.connect(dbConfig) dùng lại pool toàn cục nếu đã có
    async getPool() {
        return sql.connect(this.dbConfig);
    }
}

module.exports = Database;
