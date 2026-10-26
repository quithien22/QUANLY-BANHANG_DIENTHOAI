// file: services/BaseService.js
// Lớp cha cho mọi Service: giữ đối tượng Database dùng chung.
class BaseService {
    constructor(db) {
        this.db = db;
    }

    async getPool() {
        return this.db.getPool();
    }

    get sql() {
        return this.db.sql;
    }
}

module.exports = BaseService;
