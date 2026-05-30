import { useState, useEffect } from "react"
import axios from "axios";
import Dashboard from "./Dashboard";

import "./index.css";

const REGIONS = [
  {
    name: "Northern Lands",
    desc: "Cold and hostile. Its people are as hard as the arcane iron they mine from its mountains.",
  },
  {
    name: "Southern Empire",
    desc: "Advanced civilization where magic and technology coexist in perfect harmony.",
  },
  {
    name: "Eastern Borders",
    desc: "Land of merchants and spies. Everything has a price and no one is who they seem.",
  },
  {
    name: "Western Forests",
    desc: "Ancient and mystical. Its inhabitants know secrets the rest of the world has forgotten.",
  },
  {
    name: "Floating Cities",
    desc: "Built on fragments of arcane land. Only the most skilled survive here.",
  },
];

const TRAITS = [
  {
    id: "bold",
    desc: "High risk, high reward. Every decision can be glory or ruin.",
  },
  {
    id: "cautious",
    desc: "You progress slower but steady. The turtle wins wars too.",
  },
  { id: "charismatic", desc: "Alliances open doors that force never could." },
  {
    id: "lone wolf",
    desc: "Deadlier in 1v1 combat. You trust no one but yourself.",
  },
  {
    id: "scholarly",
    desc: "You unlock skills before anyone else. Knowledge is power.",
  },
  {
    id: "warrior",
    desc: "Combat stats grow faster. You were born for battle.",
  },
];

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [username, setUsername] = useState(
    localStorage.getItem("bk_username") || "",
  );
  const [connected, setConnected] = useState(false);
  const [existingPlayer, setExistingPlayer] = useState(null);
  const [checkingPlayer, setCheckingPlayer] = useState(false);
  const [gender, setGender] = useState(null);
  const [traits, setTraits] = useState([]);
  const [region] = useState(
    REGIONS[Math.floor(Math.random() * REGIONS.length)],
  );
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

useEffect(() => {
  const savedUsername = localStorage.getItem('bk_username')
  if (savedUsername) {
    setUsername(savedUsername)
    setConnected(true)
    setCheckingPlayer(true)
    axios.get(`http://localhost:3001/api/players/${savedUsername}`)
      .then(res => {
        setExistingPlayer(res.data)
        setPlayer(res.data)
        setScreen('dashboard')
      })
      .catch(() => {
        setExistingPlayer(null)
      })
      .finally(() => {
        setCheckingPlayer(false)
      })
  }
}, [])

  async function checkPlayer(hiveUsername) {
    setCheckingPlayer(true);
    try {
      const res = await axios.get(
        `http://localhost:3001/api/players/${hiveUsername}`,
      );
      setExistingPlayer(res.data);
    } catch (err) {
      setExistingPlayer(null);
    } finally {
      setCheckingPlayer(false);
    }
  }

  function connectHive() {
    if (!username.trim()) return;
    if (!window.hive_keychain) {
      alert("Please install Hive Keychain extension first");
      return;
    }
    window.hive_keychain.requestSignBuffer(
      username,
      "Login to Blood Kingdom",
      "Posting",
      async (response) => {
        if (response.success) {
          setConnected(true);
          setCheckingPlayer(true);
          localStorage.setItem('bk_username', username)
          try {
            const res = await axios.get(
              `http://localhost:3001/api/players/${username}`,
            );
            setExistingPlayer(res.data);
          } catch (err) {
            setExistingPlayer(null);
          } finally {
            setCheckingPlayer(false);
          }
        } else {
          alert("Login failed: " + response.message);
        }
      },
    );
  }

  function selectTrait(t) {
    if (traits.includes(t)) {
      setTraits(traits.filter((x) => x !== t));
    } else {
      if (traits.length >= 2) return;
      setTraits([...traits, t]);
    }
  }

  async function confirmCharacter() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/players/register",
        {
          hiveUsername: username,
          gender,
          trait1: traits[0],
          trait2: traits[1],
          region: region.name,
        },
      );
      setPlayer(res.data.player);
      setScreen("welcome");
    } catch (err) {
      setError(err.response?.data?.error || "Error creating character");
    } finally {
      setLoading(false);
    }
  }

  if (screen === "landing")
    return (
      <div className="bk-wrap">
        <div className="bk-bg-pattern" />
        <div className="bk-corner tl" />
        <div className="bk-corner tr" />
        <div className="bk-corner bl" />
        <div className="bk-corner br" />
        <div className="landing">
          <div className="bk-subtitle-top">Hive RPG · Season I</div>
          <div className="bk-divider" />
          <h1 className="bk-title">Blood Kingdom</h1>
          <div className="bk-title-sub">forge your legacy</div>
          <p className="bk-lore">
            The world of Valdris awoke among ruins and arcane magic. Your
            bloodline is your only inheritance. What you do with it, your only
            glory.
          </p>

          {!connected ? (
            <>
              <div className="input-group">
                <input
                  placeholder="Your Hive username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && connectHive()}
                />
                <button className="bk-connect-btn" onClick={connectHive}>
                  Connect with Hive
                </button>
              </div>
              <p className="bk-note">
                Your Hive account is your identity. Unique and unrepeatable.
              </p>
            </>
          ) : (
            <div className="connected-area">
              <div className="bk-user-pill">⬡ {username} connected</div>
              {checkingPlayer ? (
                <p className="bk-note">Loading your hero...</p>
              ) : existingPlayer ? (
                <>
                  <p className="bk-note">
                    Welcome back, {existingPlayer.hiveUsername}
                  </p>
                  <div className="bk-features" style={{ marginTop: "24px" }}>
                    <div className="bk-feature">
                      <div className="bk-feature-title">Level</div>
                      <div className="bk-feature-desc">
                        {existingPlayer.level}
                      </div>
                    </div>
                    <div className="bk-feature">
                      <div className="bk-feature-title">Region</div>
                      <div className="bk-feature-desc">
                        {existingPlayer.region}
                      </div>
                    </div>
                    <div className="bk-feature">
                      <div className="bk-feature-title">Traits</div>
                      <div className="bk-feature-desc">
                        {existingPlayer.trait1} · {existingPlayer.trait2}
                      </div>
                    </div>
                  </div>
                  <button
                    className="bk-connect-btn"
                    style={{ marginTop: "24px" }}
                    onClick={() => {
                      setPlayer(existingPlayer);
                      setScreen("dashboard");
                    }}
                  >
                    Enter Valdris
                  </button>
                </>
              ) : (
                <>
                  <p className="bk-lore">
                    You have no hero yet. Your legend has not begun.
                  </p>
                  <button
                    className="bk-connect-btn"
                    onClick={() => setScreen("create")}
                  >
                    Create your hero
                  </button>
                </>
              )}
            </div>
          )}

          <div
            className="bk-features"
            style={{ marginTop: connected ? "48px" : "48px" }}
          >
            <div className="bk-feature">
              <i className="ti ti-sword" />
              <div className="bk-feature-title">No pay-to-win</div>
              <div className="bk-feature-desc">
                Only skill and your decisions define your destiny
              </div>
            </div>
            <div className="bk-feature">
              <i className="ti ti-map-2" />
              <div className="bk-feature-title">Living world</div>
              <div className="bk-feature-desc">
                Your decisions shape the world. So do everyone else's.
              </div>
            </div>
            <div className="bk-feature">
              <i className="ti ti-trophy" />
              <div className="bk-feature-title">Leagues & rankings</div>
              <div className="bk-feature-desc">
                Compete for real HIVE in your league every week
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  if (screen === "create")
    return (
      <div className="bk-wrap">
        <div className="bk-bg-pattern" />
        <div className="bk-corner tl" />
        <div className="bk-corner tr" />
        <div className="bk-corner bl" />
        <div className="bk-corner br" />
        <div className="landing">
          <button className="back-btn" onClick={() => setScreen("landing")}>
            ← Back
          </button>
          <div className="bk-subtitle-top">Character creation</div>
          <div className="bk-divider" />
          <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
            Your destiny begins here
          </h2>
          <div className="bk-user-pill">⬡ {username}</div>

          <div className="sep" />

          <div className="section-label">Choose your appearance</div>
          <div className="gender-grid">
            <div
              className={`gender-card ${gender === "m" ? "selected" : ""}`}
              onClick={() => setGender("m")}
            >
              <img
                src="/images/male_base.jpg"
                alt="Male character"
                className="character-preview"
              />
              <div>Male</div>
              <p>Warrior of the north</p>
            </div>
            <div
              className={`gender-card ${gender === "f" ? "selected" : ""}`}
              onClick={() => setGender("f")}
            >
              <img
                src="/images/female_base.jpg"
                alt="Female character"
                className="character-preview"
              />
              <div>Female</div>
              <p>Hunter of the south</p>
            </div>
          </div>

          <div className="sep" />

          <div className="section-label">
            Choose your traits — permanent, choose wisely
          </div>
          <div className="traits-grid">
            {TRAITS.map((t) => (
              <button
                key={t.id}
                className={`trait-card ${traits.includes(t.id) ? "selected" : ""}`}
                onClick={() => selectTrait(t.id)}
                disabled={!traits.includes(t.id) && traits.length >= 2}
              >
                <div className="trait-name">{t.id}</div>
                <div className="trait-desc">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="sep" />

          <div className="section-label">Your origin in Valdris</div>
          <div className="region-box">
            <div className="region-name">{region.name}</div>
            <div className="region-desc">{region.desc}</div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            className="bk-connect-btn"
            style={{ width: "100%", padding: "16px" }}
            onClick={confirmCharacter}
            disabled={!gender || traits.length < 2 || loading}
          >
            {loading ? "Forging..." : "Forge my character"}
          </button>
        </div>
      </div>
    );

  if (screen === "welcome")
    return (
      <div className="bk-wrap">
        <div className="bk-bg-pattern" />
        <div className="bk-corner tl" />
        <div className="bk-corner tr" />
        <div className="bk-corner bl" />
        <div className="bk-corner br" />
        <div className="landing" style={{ textAlign: "center" }}>
          <div className="bk-divider" />
          <h1 className="bk-title">Welcome to Valdris</h1>
          <p className="bk-note" style={{ marginBottom: "24px" }}>
            {region.name} witnessed your birth
          </p>
          <div className="bk-features">
            <div className="bk-feature">
              <div className="bk-feature-title">Strength</div>
              <div className="bk-feature-desc">10</div>
            </div>
            <div className="bk-feature">
              <div className="bk-feature-title">Magic</div>
              <div className="bk-feature-desc">10</div>
            </div>
            <div className="bk-feature">
              <div className="bk-feature-title">Ingenuity</div>
              <div className="bk-feature-desc">10</div>
            </div>
            <div className="bk-feature">
              <div className="bk-feature-title">Stealth</div>
              <div className="bk-feature-desc">10</div>
            </div>
            <div className="bk-feature">
              <div className="bk-feature-title">Influence</div>
              <div className="bk-feature-desc">10</div>
            </div>
            <div className="bk-feature">
              <div className="bk-feature-title">Level</div>
              <div className="bk-feature-desc">1</div>
            </div>
          </div>
          <div className="trait-pills" style={{ marginTop: "24px" }}>
            {player && (
              <>
                <span className="trait-pill">{player.trait1}</span>
                <span className="trait-pill">{player.trait2}</span>
              </>
            )}
          </div>
          <button
            className="bk-connect-btn"
            style={{ marginTop: "24px" }}
            onClick={() => setScreen("dashboard")}
          >
            Enter Valdris
          </button>
        </div>
      </div>
    );

  if (screen === "dashboard")
    return (
      <Dashboard
        player={player}
        onMission={(m) => alert(`Mission: ${m} — coming soon!`)}
      />
    );
}
