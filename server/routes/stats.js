const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

const STAT_COSTS = {
  strength:  { tokens: [{ token: 'ash', amount: 30 }, { token: 'stone', amount: 20 }] },
  magic:     { tokens: [{ token: 'dust', amount: 30 }, { token: 'ink', amount: 20 }] },
  ingenuity: { tokens: [{ token: 'ink', amount: 30 }, { token: 'dust', amount: 20 }] },
  stealth:   { tokens: [{ token: 'stone', amount: 30 }, { token: 'ink', amount: 20 }] },
  influence: { tokens: [{ token: 'dust', amount: 30 }, { token: 'ash', amount: 20 }] }
}

function getTokenCost(currentStat) {
  if (currentStat < 5)  return { multiplier: 1,  blood: 1 }
  if (currentStat < 10) return { multiplier: 2,  blood: 3 }
  if (currentStat < 20) return { multiplier: 4,  blood: 5 }
  return                       { multiplier: 10, blood: 10 }
}

router.post('/upgrade', async (req, res) => {
  const { hiveUsername, stat } = req.body
  if (!STAT_COSTS[stat]) return res.status(400).json({ error: 'Invalid stat' })

  try {
    const player = await prisma.player.findUnique({ where: { hiveUsername } })
    if (!player) return res.status(404).json({ error: 'Player not found' })

    const config = STAT_COSTS[stat]
    const currentStat = player[stat] || 0
    const { multiplier, blood } = getTokenCost(currentStat)

    for (const t of config.tokens) {
      const cost = t.amount * multiplier
      if (player[t.token] < cost) {
        return res.status(400).json({ error: `Not enough ${t.token.toUpperCase()}. Need ${cost}` })
      }
    }

    if (player.blood < blood) {
      return res.status(400).json({ error: `Not enough BLOOD. Need ${blood}` })
    }

    const updateData = { [stat]: currentStat + 1, blood: player.blood - blood }
    for (const t of config.tokens) {
      updateData[t.token] = player[t.token] - t.amount * multiplier
    }

    await prisma.player.update({ where: { hiveUsername }, data: updateData })
    const updated = await prisma.player.findUnique({ where: { hiveUsername } })
    res.json({ message: `${stat} upgraded to ${currentStat + 1}`, player: updated })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error upgrading stat' })
  }
})

router.get('/costs/:hiveUsername', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({ where: { hiveUsername: req.params.hiveUsername } })
    if (!player) return res.status(404).json({ error: 'Player not found' })

    const costs = {}
    Object.entries(STAT_COSTS).forEach(([stat, config]) => {
      const currentStat = player[stat] || 0
      const { multiplier, blood } = getTokenCost(currentStat)
      costs[stat] = {
        tokens: config.tokens.map(t => ({
          token: t.token.toUpperCase(),
          amount: t.amount * multiplier
        })),
        bloodCost: blood,
        current: currentStat
      }
    })

    res.json({ costs })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching costs' })
  }
})

module.exports = router
