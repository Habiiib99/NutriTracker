const express = require('express')
const { poolConnect } = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  const pool = await poolConnect
  const foodItems = await pool.request().query('select * from foodItems')
  res.send(foodItems.recordset)
})

router.get('/:id', async (req, res) => {
  const pool = await poolConnect
  const foodItems = await pool.request().query(`select * from foodItems where id = ${req.params.id}`)
  if (!foodItems.length) return res.status(404).send('FoodItem not found')

  res.send(foodItems[0])
})

module.exports = router