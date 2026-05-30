const express = require('express')
const cors = require('cors')
require('dotenv').config()
const db = require('./db')
const playersRouter = require('./routes/players')
const missionsRouter = require('./routes/missions')
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/missions', missionsRouter)

app.use('/api/players', playersRouter)

app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ message: 'Blood Kingdom API funcionando y conectada a MySQL' })
  } catch (error) {
    res.status(500).json({ error: 'Error conectando con MySQL' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})