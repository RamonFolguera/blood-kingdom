const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.post('/register', async (req, res) => {
  const { hiveUsername, gender, trait1, trait2, region } = req.body

  try {
    const existingPlayer = await prisma.player.findUnique({
      where: { hiveUsername }
    })

    if (existingPlayer) {
      return res.status(400).json({ error: 'Este usuario ya tiene un personaje' })
    }

    const player = await prisma.player.create({
      data: { hiveUsername, gender, trait1, trait2, region }
    })

    res.json({ message: 'Personaje creado', player })
  } catch (error) {
    res.status(500).json({ error: 'Error creando el personaje' })
  }
})

router.get('/:hiveUsername', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { hiveUsername: req.params.hiveUsername }
    })

    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' })
    }

    res.json(player)
  } catch (error) {
    res.status(500).json({ error: 'Error buscando el jugador' })
  }
})

module.exports = router