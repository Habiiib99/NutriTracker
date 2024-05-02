import express from 'express'
import dbConfig from '../dbConfig'
import sql from 'mssql'

const app = express.Router()

app.post('/register', async (req, res) => {
  const { name, password, age, weight, gender, email } = req.body;
  console.log(req.body)
  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId FROM profiles WHERE email = @email');

    if (user.recordset.length !== 0) {
      console.log(user.recordset.length)
      return res.status(400).json({ message: 'En bruger med den email eksisterer allerede' });
    }

    const result = await pool.request()
      .input('userId', sql.Int, user.recordset.length + 1)
      .input('name', sql.VarChar, name)
      .input('age', sql.Int, age)
      .input('gender', sql.VarChar, gender)
      .input('weight', sql.Decimal(5, 2), weight)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('bmr', sql.Decimal(5, 4), calculateBMR(weight, age, gender))
      .query(
        'INSERT INTO profiles VALUES (@userId, @name, @age, @gender, @weight, @email, @password, @bmr)',
      ).catch((error) => { console.error(error) })

    res.status(201).json({ message: 'Bruger oprettet', id: result.insertId })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Serverfejl ved forsøg på registrering', error: error.message });
  }
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  try {
    const pool = await sql.connect(dbConfig);
    const user = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT userId, name, age, gender, weight, email, password, bmr FROM profiles WHERE email = @email');

    if (user.recordset.length === 0) {
      console.log(user.recordset.length)
      return res.status(404).json({ message: 'Ugyldig email' });
    }
    console.log(user.recordset)
    if (user.recordset[0].password != password) {
      return res.status(401).json({ message: 'Ugyldigt password' });
    }

    delete user.recordset[0].password
    res.status(200).json({ message: 'Login succesfuldt', user: user.recordset[0] })

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Serverfejl ved forsøg på login', error: error.message });
  }
});

app.delete('/delete/:userId', async (req, res) => {
  console.log(req.params)
  const { userId } = req.params

  const pool = await sql.connect(dbConfig)

  pool.request().input('userId', sql.Int, userId)
    .query('DELETE FROM meals WHERE userId = @userId').then(() => {

      pool
        .request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM profiles WHERE userId = @userId').then((result) => {
          return res.status(201).json({ message: 'Bruger slettet' })
        }).catch((error) => {
          return res.status(500).json({
            message: 'Serverfejl ved forsøg på sletning af bruger', error: error,
          })
        })
    })
});


module.exports = app