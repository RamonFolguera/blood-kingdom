const TRAIT_BONUSES = {
  bold:        { strength: 3, magic: 2 },
  cautious:    { influence: 3, stealth: 2 },
  charismatic: { influence: 4, stealth: 1 },
  'lone wolf': { stealth: 3, strength: 2 },
  scholarly:   { ingenuity: 3, magic: 2 },
  warrior:     { strength: 4, ingenuity: 1 }
}

function calcStats(player) {
  const stats = { strength: 0, magic: 0, ingenuity: 0, stealth: 0, influence: 0 }
  const b1 = TRAIT_BONUSES[player.trait1] || {}
  const b2 = TRAIT_BONUSES[player.trait2] || {}
  Object.keys(stats).forEach(s => {
    stats[s] = (player[s] || 0) + (b1[s] || 0) + (b2[s] || 0)
  })
  return stats
}

module.exports = { calcStats }