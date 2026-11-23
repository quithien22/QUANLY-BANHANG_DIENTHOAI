/**
 * init-db.js
 * Script tu dong kiem tra va khoi tao co so du lieu SQL Server khi container khoi dong.
 */
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const server = process.env.DB_SERVER || 'sqlserver';
const port = Number(process.env.DB_PORT) || 1433;
const user = process.env.DB_USER || 'sa';
const password = process.env.DB_PASSWORD || 'YourStrong@Password123';
const database = process.env.DB_NAME || 'QuanLyBanHangDienThoai';

const masterConfig = {
    user,
    password,
    server,
    port,
    database: 'master',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 5000,
        requestTimeout: 30000
    }
};

const appDbConfig = {
    ...masterConfig,
    database
};

async function waitAndConnect(config, maxAttempts = 30, intervalMs = 2000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[INIT-DB] Dang ket noi SQL Server (${config.server}:${config.port}/${config.database}) - lan thu ${attempt}/${maxAttempts}...`);
            const pool = await new sql.ConnectionPool(config).connect();
            console.log('[INIT-DB] Ket noi thanh cong!');
            return pool;
        } catch (err) {
            console.log(`[INIT-DB] Chua the ket noi (${err.message}). Cho ${intervalMs / 1000}s...`);
            if (attempt === maxAttempts) {
                throw new Error(`[INIT-DB] Khong the ket noi den SQL Server sau ${maxAttempts} lan thu.`);
            }
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }
}

async function run() {
    console.log('========================================================');
    console.log('[INIT-DB] BAT DAU QUA TRINH KIEM TRA VA KHOI TAO CSDL');
    console.log('========================================================');

    // 1. Ket noi den master de kiem tra CSDL ton tai chua
    let masterPool;
    try {
        masterPool = await waitAndConnect(masterConfig);
        const checkDb = await masterPool.request()
            .input('dbName', sql.VarChar, database)
            .query("SELECT database_id FROM sys.databases WHERE name = @dbName");

        if (checkDb.recordset.length === 0) {
            console.log(`[INIT-DB] Co so du lieu [${database}] chua ton tai. Dang tao moi...`);
            await masterPool.request().query(`CREATE DATABASE [${database}]`);
            console.log(`[INIT-DB] Da tao thanh cong CSDL [${database}]!`);
        } else {
            console.log(`[INIT-DB] Co so du lieu [${database}] da ton tai.`);
        }
    } finally {
        if (masterPool) {
            await masterPool.close();
        }
    }

    // 2. Ket noi truc tiep vao database ung dung
    let appPool;
    try {
        appPool = await waitAndConnect(appDbConfig, 10, 1000);

        // Kiem tra bang SanPham xem da co du lieu / schema chua
        const checkTable = await appPool.request()
            .query("SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SanPham'");

        if (checkTable.recordset.length === 0) {
            console.log(`[INIT-DB] Cac bang chua duoc tao. Dang doc va thuc thi init.sql...`);
            const sqlFilePath = path.join(__dirname, 'init.sql');

            if (!fs.existsSync(sqlFilePath)) {
                console.error(`[INIT-DB] Khong tim thay file ${sqlFilePath}!`);
                process.exit(1);
            }

            const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

            // Tach cac lenh bang tu khoa 'GO'
            const batches = sqlContent
                .split(/^\s*GO\s*$/gim)
                .map((b) => b.trim())
                .filter((b) => b.length > 0);

            for (const batch of batches) {
                // Bo qua cac cau lenh USE database vi da ket noi thang vao DB
                if (/^USE\s+\[?QuanLyBanHangDienThoai\]?/i.test(batch) || /^USE\s+\[?master\]?/i.test(batch)) {
                    continue;
                }
                if (/^IF DB_ID/i.test(batch) || /^CREATE DATABASE/i.test(batch)) {
                    continue;
                }
                try {
                    await appPool.request().query(batch);
                } catch (batchErr) {
                    console.warn(`[INIT-DB] Canh bao khi chay batch: ${batchErr.message}`);
                }
            }

            console.log(`[INIT-DB] Da khoi tao thanh cong toan bo bang va du lieu mau cho CSDL [${database}]!`);
        } else {
            console.log(`[INIT-DB] Bang [SanPham] da ton tai. Bo qua buoc nap du lieu mau.`);
        }
    } finally {
        if (appPool) {
            await appPool.close();
        }
    }

    console.log('========================================================');
    console.log('[INIT-DB] HOAN TAT KHOI TAO CSDL!');
    console.log('========================================================');
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('[INIT-DB] Loi nghiem trong:', err);
        process.exit(1);
    });
