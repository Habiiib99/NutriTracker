const sql = require('mssql')

const sqlConfig = {
  user: 'sa',
  password: 'yourStrong(!)Password',
  server: 'localhost',
  database: 'NutriTracker',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
}

export const poolConnect = new sql.ConnectionPool(sqlConfig).connect()