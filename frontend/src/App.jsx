import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const API_BASE = '/api'

// Country code to flag emoji mapping
const countryFlags = {
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'France': '🇫🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Germany': '🇩🇪', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Mexico': '🇲🇽', 'USA': '🇺🇸',
  'Colombia': '🇨🇴', 'Uruguay': '🇺🇾', 'Chile': '🇨🇱', 'Ecuador': '🇪🇨',
  'Peru': '🇵🇪', 'Turkey': '🇹🇷', 'Russia': '🇷🇺', 'Ukraine': '🇺🇦',
  'Poland': '🇵🇱', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Saudi Arabia': '🇸🇦',
  'Egypt': '🇪🇬', 'South Africa': '🇿🇦', 'Nigeria': '🇳🇬', 'Morocco': '🇲🇦',
  'China': '🇨🇳', 'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Thailand': '🇹🇭',
  'Greece': '🇬🇷', 'Austria': '🇦🇹', 'Switzerland': '🇨🇭', 'Denmark': '🇩🇰',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Finland': '🇫🇮', 'Ireland': '🇮🇪',
  'Croatia': '🇭🇷', 'Serbia': '🇷🇸', 'Czech Republic': '🇨🇿', 'Romania': '🇷🇴',
  'Hungary': '🇭🇺', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Czechia': '🇨🇿'
}

function getFlag(country) {
  return countryFlags[country] || '⚽'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getScoreClass(match) {
  if (match.home_goals === null || match.away_goals === null) return ''
  if (match.home_goals > match.away_goals) return 'home-win'
  if (match.home_goals < match.away_goals) return 'away-win'
  return 'draw'
}

function App() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [season, setSeason] = useState(2024)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [syncedMatches, setSyncedMatches] = useState([])
  const [showResults, setShowResults] = useState(false)
  
  // Check API health on mount
  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then(res => res.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    setTeams([])
    setSelectedTeam(null)
    setStatusMessage(null)

    try {
      const response = await fetch(`${API_BASE}/teams/search/${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      const teamsList = data.results || data.teams || data || []
      setTeams(teamsList)

      if (teamsList.length === 0) {
        setStatusMessage({ type: 'info', text: 'No teams found. Try a different search.' })
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to search teams. Check your connection.' })
    } finally {
      setSearching(false)
    }
  }

  const handleSync = async () => {
    if (!selectedTeam) return

    setLoading(true)
    setStatusMessage(null)
    setSyncedMatches([])

    try {
      const response = await fetch(`${API_BASE}/teams/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: selectedTeam.team_id, season })
      })

      if (!response.ok) throw new Error('Sync failed')

      const data = await response.json()
      setStatusMessage({ type: 'success', text: data.message || `Successfully synced ${data.count || 0} matches!` })

      if (data.matches && data.matches.length > 0) {
        setSyncedMatches(data.matches)
        setShowResults(true)
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Failed to sync data. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="stadium-bg" />
      <div className="noise" />

      <div className="app">
        {/* Header */}
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="logo">
            <div className="logo-icon">⚽</div>
            <span className="logo-text">FUTDATA</span>
          </div>
          <div className={`status-badge ${apiStatus === 'online' ? 'online' : ''}`}>
            <span className="status-dot" />
            <span>{apiStatus === 'online' ? 'API Connected' : 'Connecting...'}</span>
          </div>
        </motion.header>

        {/* Hero */}
        <motion.section
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="hero-title">
            Football <span>Data</span> Pipeline
          </h1>
          <p className="hero-subtitle">
            Search teams, sync match data, and build your football database with ease.
          </p>
        </motion.section>

        {/* Main Content */}
        <div className="content-grid">
          {/* Search Card */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="card-header">
              <div className="card-icon">🔍</div>
              <div>
                <h2 className="card-title">SEARCH TEAMS</h2>
                <p className="card-subtitle">Find your favorite football club</p>
              </div>
            </div>

            <form onSubmit={handleSearch}>
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search team name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={searching}
                />
                <button type="submit" className="search-btn" disabled={searching || !searchQuery.trim()}>
                  {searching ? '...' : 'Search'}
                </button>
              </div>
            </form>

            <div className="team-results">
              <AnimatePresence>
                {teams.length > 0 && teams.map((team, index) => (
                  <motion.div
                    key={team.team_id}
                    className={`team-card ${selectedTeam?.team_id === team.team_id ? 'selected' : ''}`}
                    onClick={() => setSelectedTeam(team)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="team-flag">{getFlag(team.country)}</span>
                    <div className="team-info">
                      <div className="team-name">{team.name}</div>
                      <div className="team-country">{team.country}</div>
                    </div>
                    <span className="team-id">ID: {team.team_id}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sync Card */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="card-header">
              <div className="card-icon">📥</div>
              <div>
                <h2 className="card-title">SYNC DATA</h2>
                <p className="card-subtitle">Import match history to database</p>
              </div>
            </div>

            {selectedTeam ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="selected-team">
                  <span className="selected-team-icon">{getFlag(selectedTeam.country)}</span>
                  <div>
                    <div className="selected-team-name">{selectedTeam.name}</div>
                    <div className="selected-team-country">{selectedTeam.country}</div>
                  </div>
                </div>

                <div className="season-selector">
                  <label className="season-label">Season:</label>
                  <input
                    type="number"
                    className="season-input"
                    value={season}
                    onChange={(e) => setSeason(parseInt(e.target.value) || 2024)}
                    min="2000"
                    max="2030"
                  />
                </div>

                <button
                  className="sync-btn"
                  onClick={handleSync}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Syncing...
                    </>
                  ) : (
                    'Sync Match Data'
                  )}
                </button>
              </motion.div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <p className="empty-state-text">Select a team to sync match data</p>
              </div>
            )}

            <AnimatePresence>
              {statusMessage && (
                <motion.div
                  className={`status-message ${statusMessage.type}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {statusMessage.type === 'success' && '✓ '}
                  {statusMessage.type === 'error' && '✕ '}
                  {statusMessage.type === 'info' && 'ℹ '}
                  {statusMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && syncedMatches.length > 0 && (
            <motion.section
              className="results-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="results-header">
                <div className="results-title-wrapper">
                  <div className="card-icon">📊</div>
                  <div>
                    <h2 className="card-title">SYNCED MATCHES</h2>
                    <p className="card-subtitle">{syncedMatches.length} games saved to database</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowResults(false)}>
                  ✕
                </button>
              </div>

              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Championship</th>
                      <th>Home Team</th>
                      <th>Score</th>
                      <th>Away Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncedMatches.map((match, index) => (
                      <motion.tr
                        key={match.match_id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                      >
                        <td className="date-cell">{formatDate(match.game_date)}</td>
                        <td className="championship-cell">{match.championship}</td>
                        <td className={`team-cell ${match.home_goals > match.away_goals ? 'winner' : ''}`}>
                          {match.home_team}
                        </td>
                        <td className="score-cell">
                          <span className={`score ${getScoreClass(match)}`}>
                            {match.home_goals ?? '-'} : {match.away_goals ?? '-'}
                          </span>
                        </td>
                        <td className={`team-cell ${match.away_goals > match.home_goals ? 'winner' : ''}`}>
                          {match.away_team}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          className="footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="footer-text">
            Built with ⚽ by <a href="#" className="footer-link">FutData</a> • Powered by API-Football
          </p>
        </motion.footer>
      </div>
    </>
  )
}

export default App