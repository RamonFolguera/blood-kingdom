const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

const MISSION_CONFIG = {
  explore:     { energy: 20, minutes: 2, token: 'dust',  amount: 10 },
  investigate: { energy: 15, minutes: 2, token: 'ink',   amount: 10 },
  defend:      { energy: 10, minutes: 1, token: 'stone', amount: 10 },
  attack:      { energy: 30, minutes: 3, token: 'ash',   amount: 10 }
}

router.post('/start', async (req, res) => {
  const { hiveUsername, type } = req.body
  const config = MISSION_CONFIG[type]
  if (!config) return res.status(400).json({ error: 'Invalid mission type' })

  try {
    const player = await prisma.player.findUnique({
      where: { hiveUsername },
      include: { missions: { where: { status: 'active' } } }
    })

    if (!player) return res.status(404).json({ error: 'Player not found' })
    if (player.missions.length > 0) return res.status(400).json({ error: 'You already have an active mission' })
    if (player.energy < config.energy) return res.status(400).json({ error: 'Not enough energy' })

    const endsAt = new Date()
    endsAt.setMinutes(endsAt.getMinutes() + config.minutes)

    const mission = await prisma.mission.create({
      data: { playerId: player.id, type, endsAt }
    })

    await prisma.player.update({
      where: { hiveUsername },
      data: { energy: player.energy - config.energy }
    })

    res.json({ message: 'Mission started', mission })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error starting mission' })
  }
})

router.get('/active/:hiveUsername', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { hiveUsername: req.params.hiveUsername },
      include: { missions: { where: { status: 'active' } } }
    })

    if (!player) return res.status(404).json({ error: 'Player not found' })
    res.json({ mission: player.missions[0] || null })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching mission' })
  }
})

router.post('/complete', async (req, res) => {
  const { hiveUsername, missionId } = req.body

  try {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { player: true }
    })

    if (!mission) return res.status(404).json({ error: 'Mission not found' })
    if (mission.player.hiveUsername !== hiveUsername) return res.status(403).json({ error: 'Unauthorized' })
    if (mission.status !== 'active') return res.status(400).json({ error: 'Mission already completed' })
    if (new Date() < new Date(mission.endsAt)) return res.status(400).json({ error: 'Mission not finished yet' })

    const config = MISSION_CONFIG[mission.type]

    let bonus = 0
    let event = null
    const roll = Math.random()
    if (roll < 0.15) {
      event = { type: 'ambush', desc: 'You were ambushed! Lost some tokens.', modifier: -0.5 }
      bonus = Math.floor(config.amount * -0.5)
    } else if (roll < 0.30) {
      event = { type: 'lucky', desc: 'You found hidden treasure! Extra tokens.', modifier: 0.5 }
      bonus = Math.floor(config.amount * 0.5)
    }

    const tokenGained = Math.max(0, config.amount + bonus)

    await prisma.mission.update({
      where: { id: missionId },
      data: { status: 'completed', result: event ? event.type : 'success' }
    })

    await prisma.player.update({
      where: { hiveUsername },
      data: { [config.token]: mission.player[config.token] + tokenGained }
    })

    res.json({ message: 'Mission completed', tokenGained, token: config.token, event })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error completing mission' })
  }
})

router.post('/cancel', async (req, res) => {
  const { hiveUsername, missionId } = req.body

  try {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { player: true }
    })

    if (!mission) return res.status(404).json({ error: 'Mission not found' })
    if (mission.player.hiveUsername !== hiveUsername) return res.status(403).json({ error: 'Unauthorized' })
    if (mission.status !== 'active') return res.status(400).json({ error: 'Mission already completed' })

    await prisma.mission.update({
      where: { id: missionId },
      data: { status: 'cancelled' }
    })

    res.json({ message: 'Mission cancelled' })
  } catch (error) {
    res.status(500).json({ error: 'Error cancelling mission' })
  }
})

module.exports = router