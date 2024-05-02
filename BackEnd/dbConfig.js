export const dbConfig = {
  user: process.env.DB_USER || 'Habib',
  password: process.env.DB_PASSWORD || 'Dhdh2399!',
  server: process.env.DB_SERVER || 'servertesthabib.database.windows.net',
  database: process.env.DB_DB || 'test',
  options: {
    encrypt: true, // for Azure
    trustServerCertificate: true // nødvendig for lokal udvikling, ikke nødvendig for Azure
  }
};