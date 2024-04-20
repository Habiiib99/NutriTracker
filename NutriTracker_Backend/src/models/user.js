// Ved at bruge 'mssql' kan vi lave SQL-kommandoer fra Node.js, da vi forbinder til vores SQL Server database
const sql = require('mssql');
const { poolConnect } = require('../db');

// Funktioner for at interagere med databasen for brugere
async function createUser(username, password, email, age, gender, weight) {
    // SQL kode for at tilføje en ny bruger i databasen
    const pool = await poolConnect;
    await pool.request()
        .input('username', sql.VarChar, username)
        .input('password', sql.VarChar, password) // Dette skal 'hashes' før det indsættes?
        .input('email', sql.VarChar, email)
        .input('age', sql.Int, age)
        .input('gender', sql.VarChar, gender)
        .input('weight', sql.Decimal(5, 2), weight)
        .query('INSERT INTO profiles (username, password, email, age, gender, weight) VALUES (@username, @password, @email, @age, @gender, @weight)');

}

async function getUserByUsername(username) {
    // SQL kode for at hente en bruger ved brugernavn
    const pool = await poolConnect;
    const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM profiles WHERE username = @username');
    return result.recordset[0]; // Returnerer det første resultat, da der kun kan være én bruger med det brugernavn
}

async function updateUser(userId, username, password, age, gender, weight) {
    // SQL kode for at opdatere en brugers oplysninger
    const pool = await poolConnect;
    await pool.request()
        .input('userId', sql.Int, userId)
        .input('username', sql.VarChar, username)
        .input('password', sql.VarChar, password)
        .input('age', sql.Int, age)
        .input('gender', sql.VarChar, gender)
        .input('weight', sql.Decimal(5, 2), weight)
    .query('UPDATE profiles SET username = @username, password = @password, age = @age, gender = @gender, weight = @weight');
}

async function deleteUser(userId) {
    // SQL kode for at slette en bruger
    const pool = await poolConnect;
    await pool.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM profiles WHERE userId = @userId');
}

module.exports = {
    createUser,
    getUserByUsername,
    updateUser,
    deleteUser
};

