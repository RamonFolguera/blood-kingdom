const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

async function updateEnergy(player) {
  const now = new Date()
  const lastUpdate = new Date(player.lastEnergyUpdate)
  const hoursPassed = (now - lastUpdate) / 1000 / 60 / 60
  const energyToAdd = Math.floor(hoursPassed / 24 * 20)

  if (energyToAdd > 0) {
    const newEnergy = Math.min(100, player.energy + energyToAdd)
    await prisma.player.update({
      where: { hiveUsername: player.hiveUsername },
      data: {
        energy: newEnergy,
        lastEnergyUpdate: now
      }
    })
    return { ...player, energy: newEnergy }
  }
  return player
}

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
    let player = await prisma.player.findUnique({
      where: { hiveUsername: req.params.hiveUsername }
    })

    if (!player) return res.status(404).json({ error: 'Player not found' })

    player = await updateEnergy(player)

    res.json(player)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching player' })
  }
})

module.exports = router