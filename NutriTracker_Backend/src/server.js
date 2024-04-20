const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use('/meals', require('./routes/meals'))
app.use('/foodItem', require('./routes/foodItems'))


app.listen(3000, () => {
  console.log('Server started on http://localhost:3000')
})