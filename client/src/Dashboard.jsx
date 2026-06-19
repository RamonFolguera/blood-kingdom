import { useState, useEffect } from "react";
import axios from "axios";

const TRAIT_BONUSES = {
  bold: { strength: 3, magic: 2 },
  cautious: { influence: 3, stealth: 2 },
  charismatic: { influence: 4, stealth: 1 },
  "lone wolf": { stealth: 3, strength: 2 },
  scholarly: { ingenuity: 3, magic: 2 },
  warrior: { strength: 4, ingenuity: 1 },
};

function calcStats(player) {
  const stats = { strength: 0, magic: 0, ingenuity: 0, stealth: 0, influence: 0 };
  const b1 = TRAIT_BONUSES[player.trait1] || {};
  const b2 = TRAIT_BONUSES[player.trait2] || {};
  Object.keys(stats).forEach((s) => {
    stats[s] = (player[s] || 0) + (b1[s] || 0) + (b2[s] || 0);
  });
  return stats;
}

const MISSIONS = [
  { id: "explore", label: "Explore", icon: "ti-map-2", energy: 20, token: "DUST", desc: "Venture into the unknown" },
  { id: "attack", label: "Attack", icon: "ti-sword", energy: 30, token: "ASH", desc: "Challenge another player" },
  { id: "defend", label: "Defend", icon: "ti-shield", energy: 10, token: "STONE", desc: "Fortify your position" },
  { id: "investigate", label: "Investigate", icon: "ti-search", energy: 15, token: "INK", desc: "Uncover hidden secrets" },
];

export default function Dashboard({ player: initialPlayer }) {
  const [player, setPlayer] = useState(initialPlayer);
  const [selectedMission, setSelectedMission] = useState(null);
  const [activeMission, setActiveMission] = useState(null);
  const [confirmRetreat, setConfirmRetreat] = useState(false);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setTick] = useState(0);
  const [costs, setCosts] = useState(null);
  const [upgradeMsg, setUpgradeMsg] = useState(null);
  const [upgradingStats, setUpgradingStats] = useState({});
  const stats = calcStats(player);
  const imgSrc = player.gender === "m" ? "/images/male_base.jpg" : "/images/female_base.jpg";

  useEffect(() => {
    fetchActiveMission();
    fetchCosts();
    const missionInterval = setInterval(fetchActiveMission, 30000);
    const tickInterval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(missionInterval);
      clearInterval(tickInterval);
    };
  }, []);

  async function fetchActiveMission() {
    try {
      const res = await axios.get(`http://localhost:3001/api/missions/active/${player.hiveUsername}`);
      setActiveMission(res.data.mission);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCosts() {
    try {
      const res = await axios.get(`http://localhost:3001/api/stats/costs/${player.hiveUsername}`);
      setCosts(res.data.costs);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshPlayer() {
    const res = await axios.get(`http://localhost:3001/api/players/${player.hiveUsername}`);
    setPlayer(res.data);
  }

  async function startMission() {
    if (!selectedMission) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:3001/api/missions/start", {
        hiveUsername: player.hiveUsername,
        type: selectedMission,
      });
      setActiveMission(res.data.mission);
      setSelectedMission(null);
      await refreshPlayer();
    } catch (err) {
      setError(err.response?.data?.error || "Error starting mission");
    } finally {
      setLoading(false);
    }
  }

  async function completeMission() {
    if (!activeMission) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:3001/api/missions/complete", {
        hiveUsername: player.hiveUsername,
        missionId: activeMission.id,
      });
      setEvent(res.data);
      setActiveMission(null);
      await refreshPlayer();
      await fetchCosts();
    } catch (err) {
      setError(err.response?.data?.error || "Error completing mission");
    } finally {
      setLoading(false);
    }
  }

  async function cancelMission() {
    setLoading(true);
    try {
      await axios.post("http://localhost:3001/api/missions/cancel", {
        hiveUsername: player.hiveUsername,
        missionId: activeMission.id,
      });
      setActiveMission(null);
      setConfirmRetreat(false);
      await refreshPlayer();
    } catch (err) {
      setError(err.response?.data?.error || "Error cancelling mission");
    } finally {
      setLoading(false);
    }
  }

  async function upgradeStat(stat) {
    setUpgradingStats((prev) => ({ ...prev, [stat]: true }));
    try {
      const res = await axios.post("http://localhost:3001/api/stats/upgrade", {
        hiveUsername: player.hiveUsername,
        stat,
      });
      setPlayer(res.data.player);
      await fetchCosts();
      setUpgradeMsg({ type: "success", text: `+1 ${stat.charAt(0).toUpperCase() + stat.slice(1)}!` });
      setTimeout(() => setUpgradeMsg(null), 2000);
    } catch (err) {
      setUpgradeMsg({ type: "error", text: err.response?.data?.error || "Error upgrading" });
      setTimeout(() => setUpgradeMsg(null), 3000);
    } finally {
      setUpgradingStats((prev) => ({ ...prev, [stat]: false }));
    }
  }

  function timeLeft(endsAt) {
    const diff = new Date(endsAt) - new Date();
    if (diff <= 0) return "Ready to complete";
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    if (mins > 0) return `${mins}m ${secs}s remaining`;
    return `${secs}s remaining`;
  }

  function isMissionDone(endsAt) {
    return new Date() >= new Date(endsAt);
  }

  return (
    <div className="db-wrap">
      <div className="bk-bg-pattern" />

      <div className="db-topbar">
        <div className="db-top-left">
          <span className="db-username">⬡ {player.hiveUsername}</span>
          <span className="db-region">{player.region}</span>
        </div>
        <div className="db-top-center">
          <span className="db-level">Level {player.level}</span>
        </div>
        <div className="db-top-right">
          <span className="db-energy-label">Energy</span>
          <div className="db-energy-bar">
            <div className="db-energy-fill" style={{ width: `${player.energy}%` }} />
          </div>
          <span className="db-energy-val">{player.energy}/100</span>
        </div>
      </div>

      <div className="db-event">
        <span className="db-event-label">Today's event</span>
        <span className="db-event-text">
          The arcane storms of Valdris grow stronger. Explorers report strange ruins emerging from the eastern fog.
        </span>
      </div>

      <div className="db-main">

        <div className="db-stats-panel">
          {upgradeMsg && (
            <div className={`stat-upgrade-msg ${upgradeMsg.type}`}>
              {upgradeMsg.text}
            </div>
          )}
          {Object.entries(stats).map(([key, val]) => (
            <div className="db-stat-row" key={key}>
              <div className="db-stat">
                <div className="db-stat-bar-wrap">
                  <div className="db-stat-bar" style={{ height: `${Math.min(val * 8, 100)}%` }} />
                </div>
                <div className="db-stat-val">{val}</div>
                <div className="db-stat-lbl">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
              </div>
              {costs && costs[key] && (
                <div className="db-train-card">
                  <div className="db-train-costs">
                    {costs[key].tokens.map((t) => (
                      <span key={t.token} className="db-train-token">{t.amount} {t.token}</span>
                    ))}
                    <span className="db-train-blood">{costs[key].bloodCost} BLOOD</span>
                  </div>
                  <button
                    className="db-train-btn"
                    onClick={() => upgradeStat(key)}
                    disabled={upgradingStats[key]}
                  >
                    {upgradingStats[key] ? "..." : "Train"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="db-character-wrap">
          <div className="db-traits-hover">
            <span className="trait-pill">{player.trait1}</span>
            <span className="trait-pill">{player.trait2}</span>
          </div>
          <img src={imgSrc} alt="Your character" className="db-character-img" />
          <div className="db-char-glow" />
          <div className="db-tokens">
            <div className="db-token"><span className="db-token-val">{player.dust}</span><span className="db-token-lbl">DUST</span></div>
            <div className="db-token"><span className="db-token-val">{player.ink}</span><span className="db-token-lbl">INK</span></div>
            <div className="db-token"><span className="db-token-val">{player.stone}</span><span className="db-token-lbl">STONE</span></div>
            <div className="db-token"><span className="db-token-val">{player.ash}</span><span className="db-token-lbl">ASH</span></div>
            <div className="db-token"><span className="db-token-val">{player.blood}</span><span className="db-token-lbl">BLOOD</span></div>
          </div>
        </div>

        <div className="db-missions">
          {activeMission ? (
            <div className="db-active-mission">
              <div className="db-active-label">Active mission</div>
              <div className="db-active-type">{activeMission.type.toUpperCase()}</div>
              <div className="db-active-time">{timeLeft(activeMission.endsAt)}</div>
              {isMissionDone(activeMission.endsAt) && (
                <button className="bk-connect-btn" style={{ marginTop: "12px", width: "100%" }} onClick={completeMission} disabled={loading}>
                  {loading ? "Completing..." : "Complete mission"}
                </button>
              )}
              {!confirmRetreat ? (
                <button className="db-cancel" style={{ marginTop: "8px", display: "block", width: "100%" }} onClick={() => setConfirmRetreat(true)}>
                  Retreat
                </button>
              ) : (
                <div style={{ marginTop: "8px" }}>
                  <div className="db-active-time" style={{ marginBottom: "8px" }}>You will lose the energy spent. Are you sure?</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="bk-connect-btn" style={{ flex: 1, padding: "8px" }} onClick={cancelMission} disabled={loading}>
                      {loading ? "..." : "Confirm"}
                    </button>
                    <button className="db-cancel" onClick={() => setConfirmRetreat(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            MISSIONS.map((m) => (
              <div key={m.id} className={`db-mission ${selectedMission === m.id ? "selected" : ""}`} onClick={() => setSelectedMission(m.id)}>
                <i className={`ti ${m.icon}`} aria-hidden="true" />
                <div className="db-mission-label">{m.label}</div>
                <div className="db-mission-meta">{m.energy} energy · +{m.token}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {event && (
        <div className="db-event-notif">
          <div className="db-event-notif-text">{event.event ? event.event.desc : "Mission completed successfully!"}</div>
          <div className="db-event-notif-reward">+{event.tokenGained} {event.token.toUpperCase()}</div>
          <button className="db-cancel" onClick={() => setEvent(null)}>Dismiss</button>
        </div>
      )}

      {selectedMission && !activeMission && (
        <div className="db-confirm">
          <div className="db-confirm-desc">{MISSIONS.find((m) => m.id === selectedMission)?.desc}</div>
          {error && <div className="error">{error}</div>}
          <button className="bk-connect-btn" onClick={startMission} disabled={loading}>
            {loading ? "Starting..." : "Begin mission"}
          </button>
          <button className="db-cancel" onClick={() => { setSelectedMission(null); setError(null); }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
