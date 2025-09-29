import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'critical_designer_alphabet',
    connectionLimit: 10,
    acquireTimeout: 60000
});

export async function getConnection() {
    return await pool.getConnection();
}

export async function query(sql: string, params?: any[]) {
    let conn;
    try {
        conn = await getConnection();
        const result = await conn.query(sql, params);
        return result;
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

export default pool;