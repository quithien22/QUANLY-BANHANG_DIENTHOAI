// file: routes/BaseRoutes.js
// Lớp cha cho các lớp định tuyến: giữ express.Router và đường dẫn gốc để mount.
const express = require('express');

class BaseRoutes {
    constructor(basePath) {
        this.basePath = basePath;
        this.router = express.Router();
    }

    // Lớp con ghi đè hàm này để khai báo các route
    registerRoutes() {}

    getRouter() {
        return this.router;
    }

    // Dùng trong container: { path, router }
    toMount() {
        return { path: this.basePath, router: this.router };
    }
}

module.exports = BaseRoutes;
