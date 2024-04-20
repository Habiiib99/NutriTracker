const express = require('express')
const { poolConnect } = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  const pool = await poolConnect
  const meals = await pool.request().query('select * from meals')
  res.send(meals.recordset)
})

router.get('/:id', async (req, res) => {
  const pool = await poolConnect
  const meals = await pool.request().query(`select * from meals where id = ${req.params.id}`)
  if (!meals.length) return res.status(404).send('Meal not found')

  res.send(meals[0])
})

router.post('/', async (req, res) => {
  const { name, profileId } = req.body

  const pool = await poolConnect
  await pool.request().query(`insert into meals (name, profileId) values ('${name}', ${profileId})`);

  res.status(202).send('Meal Created')
})

router.put('/:id', async (req, res) => {
  const { name } = req.body

  const pool = await poolConnect
  await pool.request().query(`update meals set name = '${name}' where id = ${req.params.id}`)

  res.status(202).send('Meal Updated')
})

router.delete('/:id', async (req, res) => {
  const pool = await poolConnect
  await pool.request().query(`delete from meals where id = ${req.params.id}`)

  res.status(202).send('Meal Deleted')
})

module.exports = router