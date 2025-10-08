import { PongGame } from './game/PongGame'
import { TournamentManager } from './tournament/TournamentManager'
import { AIDifficulty } from './game/AIPlayer'
import { AuthPages } from './pages/AuthPages'
import { DashboardPage } from './pages/DashboardPage'
import { ApiService } from './services/api'

export class Router {
	private routes: Map<string, () => void> = new Map()
	private currentGame: PongGame | null = null
	private tournamentManager: TournamentManager | null = null

	constructor() {
		this.setupRoutes()
	}

	private setupRoutes(): void {
		// Auth routes
		this.routes.set('/', () => this.renderHome())
		this.routes.set('/login', () => this.renderLogin())
		this.routes.set('/register', () => this.renderRegister())
		this.routes.set('/auth/callback', () => this.renderOAuthCallback())

		// Protected routes
		this.routes.set('/dashboard', () => this.renderDashboard())

		// Game routes
		this.routes.set('/game', () => this.renderGameModeSelection())
		this.routes.set('/game/vs-friend', () => this.renderGame(false))
		this.routes.set('/game/vs-ai', () => this.renderAIDifficultySelection())
		this.routes.set('/game/vs-ai/easy', () => this.renderGame(true, AIDifficulty.EASY))
		this.routes.set('/game/vs-ai/medium', () => this.renderGame(true, AIDifficulty.MEDIUM))
		this.routes.set('/game/vs-ai/hard', () => this.renderGame(true, AIDifficulty.HARD))
		this.routes.set('/tournament', () => this.renderTournament())
	}

	start(): void {
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLAnchorElement
			if (target.matches('[data-route]')) {
				e.preventDefault()
				const href = target.getAttribute('href')
				if (href) {
					this.navigate(href)
				}
			}
		})

		window.addEventListener('popstate', () => {
			this.handleRoute()
		})

		this.handleRoute()
	}

	navigate(path: string): void {
		history.pushState({}, '', path)
		this.handleRoute()
	}

	private handleRoute(): void {
		// Nettoyer le jeu quand on quitte la page
		if (this.currentGame && window.location.pathname !== '/game') {
			this.currentGame.destroy()
			this.currentGame = null
		}

		const path = window.location.pathname
		const handler = this.routes.get(path)

		if (handler) {
			handler()
		} else {
			this.navigate('/')
		}
	}

	private renderHome(): void {
		// Si l'utilisateur est connecté, rediriger vers le dashboard
		const token = ApiService.getToken();
		if (token) {
			this.navigate('/dashboard');
			return;
		}

		// Sinon, afficher la page d'accueil avec login/register
		this.updatePageContent(`
			<div class="page">
				<h2>🎮 Welcome to ft_transcendence</h2>
				<p>The ultimate Pong tournament platform!</p>
				<div class="actions">
					<a href="/login" data-route class="btn btn-primary">🔐 Sign In</a>
					<a href="/register" data-route class="btn btn-secondary">📝 Sign Up</a>
					<a href="/game" data-route class="btn btn-tertiary">🏓 Play as Guest</a>
				</div>
			</div>
		`)
	}

	private renderLogin(): void {
		this.updatePageContent(AuthPages.renderLogin())
		setTimeout(() => AuthPages.setupLoginForm(), 100)
	}

	private renderRegister(): void {
		this.updatePageContent(AuthPages.renderRegister())
		setTimeout(() => AuthPages.setupRegisterForm(), 100)
	}

	private renderOAuthCallback(): void {
		this.updatePageContent(AuthPages.renderOAuthCallback())
	}

	private renderDashboard(): void {
		// Vérifier l'authentification
		const token = ApiService.getToken();
		if (!token) {
			this.navigate('/login');
			return;
		}

		// Afficher "Loading..."
		this.updatePageContent('<div class="loading">Loading dashboard...</div>')

		// Charger le dashboard de manière asynchrone
		DashboardPage.render().then(html => {
			this.updatePageContent(html)
			DashboardPage.setupEventListeners()
		}).catch(() => {
			this.navigate('/login')
		})
	}

	private renderGameModeSelection(): void {
		this.updatePageContent(`
			<div class="page">
				<h2>🏓 Choose Game Mode</h2>
				<div class="game-mode-selector">
					<div class="mode-buttons">
						<a href="/game/vs-friend" data-route class="mode-btn-link">
							<div class="mode-btn">
								<span class="mode-icon">👥</span>
								<span class="mode-title">VS Friend</span>
								<span class="mode-desc">Local multiplayer</span>
							</div>
						</a>
						<a href="/game/vs-ai" data-route class="mode-btn-link">
							<div class="mode-btn">
								<span class="mode-icon">🤖</span>
								<span class="mode-title">VS AI</span>
								<span class="mode-desc">Play against computer</span>
							</div>
						</a>
					</div>
				</div>
			</div>
		`)
	}

	private renderAIDifficultySelection(): void {
		this.updatePageContent(`
			<div class="page">
				<h2>🤖 Choose AI Difficulty</h2>
				<div class="ai-difficulty-selector">
					<div class="difficulty-buttons">
						<a href="/game/vs-ai/easy" data-route class="difficulty-btn-link">
							<div class="difficulty-btn">
								<span class="difficulty-icon">😊</span>
								<span class="difficulty-title">Easy</span>
								<span class="difficulty-desc">Perfect for beginners</span>
							</div>
						</a>
						<a href="/game/vs-ai/medium" data-route class="difficulty-btn-link">
							<div class="difficulty-btn">
								<span class="difficulty-icon">😐</span>
								<span class="difficulty-title">Medium</span>
								<span class="difficulty-desc">Balanced challenge</span>
							</div>
						</a>
						<a href="/game/vs-ai/hard" data-route class="difficulty-btn-link">
							<div class="difficulty-btn">
								<span class="difficulty-icon">😈</span>
								<span class="difficulty-title">Hard</span>
								<span class="difficulty-desc">Expert level</span>
							</div>
						</a>
					</div>
				</div>
				<div class="back-button-container">
					<a href="/game" data-route class="btn btn-secondary">← Back to Mode Selection</a>
				</div>
			</div>
		`)
	}

	private renderGame(isAI: boolean = false, difficulty: AIDifficulty = AIDifficulty.MEDIUM): void {
		const modeText = isAI ? `VS AI (${difficulty})` : 'VS Friend'
		const controlsText = isAI ? 'Right Player: <strong>AI</strong> 🤖' : 'Right Player: <kbd>↑</kbd> / <kbd>↓</kbd>'

		this.updatePageContent(`
			<div class="page">
				<h2>🏓 Pong Game - ${modeText}</h2>
				<div class="game-container">
					<canvas id="pong-canvas"></canvas>
				</div>
				<div class="game-info">
					<p>🎮 <strong>Controls:</strong></p>
					<p>Left Player: <kbd>W</kbd> / <kbd>S</kbd></p>
					<p>${controlsText}</p>
					<p>Press <kbd>SPACE</kbd> to start!</p>
				</div>
				<div class="back-button-container">
					<a href="/game" data-route class="btn btn-secondary">← Back to Mode Selection</a>
				</div>
			</div>
		`)
		setTimeout(() => this.initPongGame(isAI, difficulty), 0)
	}

	private renderTournament(): void {
		if (!this.tournamentManager) {
			this.tournamentManager = new TournamentManager({
				name: 'Pong Championship',
				maxPlayers: 8,
				minPlayers: 2
			})
		}

		const state = this.tournamentManager.getState()

		this.updatePageContent(`
			<div class="page tournament-page">
				<h2>🏆 ${state.name}</h2>
				${this.renderTournamentContent(state)}
			</div>
		`)

		setTimeout(() => this.setupTournamentEvents(), 0)
	}

	private renderTournamentContent(state: any): string {
		switch (state.status) {
			case 'registration':
				return this.renderRegistration(state)
			case 'ready':
				return this.renderReady(state)
			case 'ongoing':
				return this.renderOngoing(state)
			case 'completed':
				return this.renderCompleted(state)
			default:
				return '<p>Unknown tournament state</p>'
		}
	}

	private renderRegistration(state: any): string {
		const canStart = this.tournamentManager?.canStart()

		// Vérifier si c'est une puissance de 2
		const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0
		const isValid = isPowerOfTwo(state.players.length)
		const playerCountClass = isValid ? 'valid-count' : 'invalid-count'

		// Calculer les puissances de 2 valides (max 8)
		const validCounts = [2, 4, 8]
		const validCountsText = validCounts.join(', ')

		return `
			<div class="tournament-section">
				<h3>📝 Player Registration</h3>
				<p class="player-count ${playerCountClass}">
					Players: ${state.players.length}/${state.maxPlayers}
					${isValid ? '✅' : '⚠️'}
				</p>
				<p class="valid-counts-hint">
					Valid player counts: ${validCountsText}
				</p>

				<div class="registration-form">
					<input type="text" id="player-alias" placeholder="Enter your alias..." maxlength="20" autocomplete="off">
					<button id="join-tournament" class="btn btn-primary">➕ Add Player</button>
				</div>

				<div class="ai-registration">
					<h4>🤖 Add AI Players</h4>
					<div class="ai-buttons">
						<button id="add-ai-easy" class="btn-ai btn-ai-easy" title="Add Easy AI">
							<span class="ai-icon">😊</span>
							<span>Easy AI</span>
						</button>
						<button id="add-ai-medium" class="btn-ai btn-ai-medium" title="Add Medium AI">
							<span class="ai-icon">😐</span>
							<span>Medium AI</span>
						</button>
						<button id="add-ai-hard" class="btn-ai btn-ai-hard" title="Add Hard AI">
							<span class="ai-icon">😈</span>
							<span>Hard AI</span>
						</button>
					</div>
				</div>

				<div class="players-list">
					<h4>👥 Registered Players:</h4>
					${state.players.length === 0 ?
						'<p class="empty-state">No players yet. Be the first to join!</p>' :
						state.players.map((player: any) => `
							<div class="player-item ${player.isAI ? 'player-ai' : 'player-human'}">
								<span class="player-alias">
									${player.isAI ? '🤖' : '🎮'} ${player.alias}
								</span>
								<button class="btn-small btn-danger" data-remove-player="${player.id}">Remove</button>
							</div>
						`).join('')
					}
				</div>
				${canStart?.canStart ? `
					<div class="tournament-actions">
						<button id="start-tournament" class="btn btn-success">
							🚀 Start Tournament (${state.players.length} players)
						</button>
					</div>
				` : `
					<p class="info-message">${canStart?.reason || 'Cannot start tournament'}</p>
				`}
				<button id="reset-tournament" class="btn btn-secondary">🔄 Reset Tournament</button>
			</div>
		`
	}

	private renderReady(state: any): string {
		const nextMatch = this.tournamentManager?.getNextMatch()
		if (!nextMatch) return '<p>No matches available</p>'

		return `
			<div class="tournament-section">
				<h3>⚡ Ready to Play</h3>
				<div class="next-match">
					<h4>🏓 Next Match:</h4>
					<div class="match-card">
						<div class="player">${nextMatch.player1.alias}</div>
						<div class="vs">VS</div>
						<div class="player">${nextMatch.player2.alias}</div>
					</div>
					<button id="start-match" data-match-id="${nextMatch.id}" class="btn btn-primary">
						🎮 Start Match
					</button>
				</div>
				${this.renderBracket(state)}
			</div>
		`
	}

	private renderOngoing(state: any): string {
		const currentMatch = state.currentMatch
		if (!currentMatch) return '<p>No ongoing match</p>'

		return `
			<div class="tournament-section">
				<h3>🏓 Match in Progress</h3>
				<div class="current-match">
					<div class="match-header">
						<span class="player">${currentMatch.player1.alias}</span>
						<span class="vs">VS</span>
						<span class="player">${currentMatch.player2.alias}</span>
					</div>
					<div class="game-container">
						<canvas id="tournament-canvas"></canvas>
					</div>
				</div>
			</div>
		`
	}

	private renderCompleted(state: any): string {
		return `
			<div class="tournament-section">
				<h3>🏆 Tournament Complete!</h3>
				<div class="winner-announcement">
					<h2>👑 Champion: ${state.winner?.alias || 'Unknown'}</h2>
					<p>Congratulations! 🎉</p>
				</div>
				${this.renderBracket(state)}
				<div class="tournament-actions">
					<button id="new-tournament" class="btn btn-primary">🔄 New Tournament</button>
				</div>
			</div>
		`
	}

	private renderBracket(_state: any): string {
		const rounds = this.tournamentManager?.getRounds() || 0
		if (rounds === 0) return ''

		let bracketHtml = '<div class="tournament-bracket"><h4>📊 Tournament Bracket</h4><div class="bracket-container">'

		for (let round = 1; round <= rounds; round++) {
			const matches = this.tournamentManager?.getMatchesForRound(round) || []
			const roundName = this.getRoundName(round, rounds)

			bracketHtml += `
				<div class="bracket-round round-${round}">
					<h5 class="round-title">${roundName}</h5>
					<div class="matches-column">
						${matches.map(match => {
							const p1Class = match.winner?.id === match.player1.id ? 'winner' : (match.status === 'completed' ? 'loser' : '')
							const p2Class = match.winner?.id === match.player2.id ? 'winner' : (match.status === 'completed' ? 'loser' : '')
							const statusIcon = match.status === 'completed' ? '✅' : (match.status === 'playing' ? '🏓' : '⏳')

							return `
								<div class="bracket-match ${match.status}">
									<div class="match-player ${p1Class}">
										<span class="player-name">
											${match.player1.isAI ? '🤖' : '🎮'} ${match.player1.alias}
										</span>
										<span class="player-score">${match.score.player1}</span>
									</div>
									<div class="match-divider">
										<span class="vs-text">VS</span>
										<span class="status-icon">${statusIcon}</span>
									</div>
									<div class="match-player ${p2Class}">
										<span class="player-name">
											${match.player2.isAI ? '🤖' : '🎮'} ${match.player2.alias}
										</span>
										<span class="player-score">${match.score.player2}</span>
									</div>
								</div>
							`
						}).join('')}
					</div>
				</div>
			`
		}

		bracketHtml += '</div></div>'
		return bracketHtml
	}

	private getRoundName(round: number, totalRounds: number): string {
		const roundsFromEnd = totalRounds - round

		if (roundsFromEnd === 0) return '🏆 Final'
		if (roundsFromEnd === 1) return '🥈 Semi-Finals'
		if (roundsFromEnd === 2) return '🥉 Quarter-Finals'

		return `Round ${round}`
	}

	private updatePageContent(html: string): void {
		const container = document.getElementById('page-content')
		if (container) {
			container.innerHTML = html
			this.addPageStyles()
		}
	}

	private initPongGame(isAI: boolean = false, difficulty: AIDifficulty = AIDifficulty.MEDIUM): void {
		const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement
		if (!canvas) {
			console.error('Canvas not found!')
			return
		}
		if (this.currentGame) {
			this.currentGame.destroy()
		}
		this.currentGame = new PongGame(canvas, isAI, difficulty)
		setTimeout(() => {
			canvas.focus()
		}, 100)
		console.log(`🎮 Pong game ready! ${isAI ? '(vs AI)' : '(vs Player)'}`)
	}


	private addPageStyles(): void {
		if (document.getElementById('page-styles')) return

		const style = document.createElement('style')
		style.id = 'page-styles'
		style.textContent = `
			.page {
				text-align: center;
				padding: 2rem;
			}
			.page h2 {
				color: #00ff41;
				margin-bottom: 1rem;
				font-size: 2rem;
			}
			.actions {
				margin-top: 2rem;
				display: flex;
				gap: 1rem;
				justify-content: center;
			}
			.btn {
				display: inline-block;
				padding: 1rem 2rem;
				text-decoration: none;
				border-radius: 8px;
				font-weight: bold;
				transition: all 0.2s;
			}
			.btn-primary {
				background: #00ff41;
				color: #000;
			}
			.btn-primary:hover {
				background: #00cc33;
				transform: translateY(-2px);
			}
			.btn-secondary {
				background: transparent;
				color: #fff;
				border: 2px solid #00ff41;
			}
			.btn-secondary:hover {
				background: #00ff41;
				color: #000;
			}
			.game-container {
				display: flex;
				justify-content: center;
				margin: 2rem 0;
			}
			#pong-canvas {
				border: 2px solid #00ff41;
				border-radius: 4px;
				box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
			}
			.game-info {
				max-width: 500px;
				margin: 0 auto;
				text-align: left;
				background: #1a1a1a;
				padding: 1rem;
				border-radius: 8px;
				border: 1px solid #333;
			}
			.game-info p {
				margin: 0.5rem 0;
				color: #ccc;
			}
			kbd {
				background: #333;
				color: #00ff41;
				padding: 0.2rem 0.4rem;
				border-radius: 4px;
				font-family: monospace;
				font-weight: bold;
			}
			.controls-grid {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 1rem;
				margin: 1rem 0;
			}
			.player-controls {
				padding: 0.5rem;
				background: #2a2a2a;
				border-radius: 4px;
			}
			.player-controls h4 {
				color: #00ff41;
				margin-bottom: 0.5rem;
				font-size: 0.9rem;
			}
			.game-controls {
				margin-top: 1rem;
				padding-top: 1rem;
				border-top: 1px solid #333;
			}
			.game-controls p {
				margin: 0.3rem 0;
			}

			/* Game Mode Selector */
			.game-mode-selector {
				margin: 2rem auto;
				max-width: 600px;
			}
			.game-mode-selector h3 {
				color: #00ff41;
				margin-bottom: 1rem;
				font-size: 1.2rem;
			}
			.mode-buttons {
				display: flex;
				gap: 1rem;
				justify-content: center;
			}
			.mode-btn {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 0.5rem;
				padding: 1.5rem;
				background: #1a1a1a;
				border: 2px solid #333;
				border-radius: 12px;
				color: #fff;
				cursor: pointer;
				transition: all 0.3s ease;
			}
			.mode-btn:hover {
				border-color: #00ff41;
				background: #222;
				transform: translateY(-2px);
			}
			.mode-btn.active {
				border-color: #00ff41;
				background: #1a2a1a;
				box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
			}
			.mode-icon {
				font-size: 3rem;
			}
			.mode-title {
				font-size: 1.2rem;
				font-weight: bold;
				color: #00ff41;
			}
			.mode-desc {
				font-size: 0.9rem;
				color: #999;
			}

			/* AI Difficulty Selector */
			.ai-difficulty-selector {
				margin: 2rem auto;
				max-width: 600px;
			}
			.ai-difficulty-selector h3 {
				color: #00ff41;
				margin-bottom: 1rem;
				font-size: 1.2rem;
			}
			.difficulty-buttons {
				display: flex;
				gap: 1rem;
				justify-content: center;
			}
			.difficulty-btn {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 0.5rem;
				padding: 1rem;
				background: #1a1a1a;
				border: 2px solid #333;
				border-radius: 8px;
				color: #fff;
				cursor: pointer;
				transition: all 0.3s ease;
			}
			.difficulty-btn:hover {
				border-color: #00ff41;
				background: #222;
			}
			.difficulty-btn.active {
				border-color: #00ff41;
				background: #1a2a1a;
				box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);
			}
			.difficulty-icon {
				font-size: 2rem;
			}
			.difficulty-title {
				font-size: 1.1rem;
				font-weight: bold;
				color: #00ff41;
			}
			.difficulty-desc {
				font-size: 0.85rem;
				color: #999;
			}

			/* Liens sans style par défaut */
			.mode-btn-link,
			.difficulty-btn-link {
				text-decoration: none;
				color: inherit;
			}

			/* Conteneur bouton retour */
			.back-button-container {
				margin-top: 2rem;
				text-align: center;
			}

			/* Tournament Styles */
			.player-count {
				font-size: 1.2rem;
				margin-bottom: 0.5rem;
				font-weight: bold;
			}
			.player-count.valid-count {
				color: #00ff41;
			}
			.player-count.invalid-count {
				color: #ff9800;
			}
			.valid-counts-hint {
				font-size: 0.9rem;
				color: #999;
				margin-bottom: 1.5rem;
				text-align: center;
			}

			/* AI Registration */
			.ai-registration {
				margin: 2rem 0;
				padding: 1.5rem;
				background: #1a1a1a;
				border-radius: 8px;
				border: 1px solid #333;
			}
			.ai-registration h4 {
				color: #00ff41;
				margin-bottom: 1rem;
			}
			.ai-buttons {
				display: flex;
				gap: 1rem;
				justify-content: center;
			}
			.btn-ai {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 0.5rem;
				padding: 1rem;
				background: #2a2a2a;
				border: 2px solid #444;
				border-radius: 8px;
				color: #fff;
				cursor: pointer;
				transition: all 0.3s ease;
			}
			.btn-ai:hover {
				transform: translateY(-2px);
				box-shadow: 0 5px 15px rgba(0, 255, 65, 0.2);
			}
			.btn-ai-easy:hover {
				border-color: #4caf50;
			}
			.btn-ai-medium:hover {
				border-color: #ff9800;
			}
			.btn-ai-hard:hover {
				border-color: #f44336;
			}
			.ai-icon {
				font-size: 2rem;
			}

			/* Players List */
			.player-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 0.75rem;
				margin: 0.5rem 0;
				border-radius: 6px;
				background: #2a2a2a;
			}
			.player-ai {
				border-left: 3px solid #00bcd4;
			}
			.player-human {
				border-left: 3px solid #00ff41;
			}

			/* Tournament Bracket */
			.tournament-bracket {
				margin: 2rem 0;
				padding: 1.5rem;
				background: #1a1a1a;
				border-radius: 8px;
			}
			.tournament-bracket h4 {
				color: #00ff41;
				margin-bottom: 1.5rem;
				text-align: center;
			}
			.bracket-container {
				display: flex;
				gap: 2rem;
				overflow-x: auto;
				padding: 1rem 0;
			}
			.bracket-round {
				flex-shrink: 0;
				min-width: 250px;
			}
			.round-title {
				color: #00ff41;
				text-align: center;
				margin-bottom: 1rem;
				padding: 0.5rem;
				background: #2a2a2a;
				border-radius: 6px;
			}
			.matches-column {
				display: flex;
				flex-direction: column;
				gap: 1.5rem;
			}
			.bracket-match {
				background: #2a2a2a;
				border-radius: 8px;
				padding: 1rem;
				border: 2px solid #444;
				transition: all 0.3s ease;
			}
			.bracket-match.playing {
				border-color: #00ff41;
				box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
			}
			.bracket-match.completed {
				border-color: #666;
			}
			.match-player {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 0.5rem;
				border-radius: 4px;
				background: #1a1a1a;
				margin: 0.25rem 0;
			}
			.match-player.winner {
				background: #1a3a1a;
				border: 1px solid #00ff41;
				font-weight: bold;
			}
			.match-player.loser {
				opacity: 0.5;
			}
			.player-name {
				flex: 1;
			}
			.player-score {
				font-size: 1.2rem;
				font-weight: bold;
				color: #00ff41;
				margin-left: 1rem;
			}
			.match-divider {
				text-align: center;
				padding: 0.5rem 0;
				display: flex;
				justify-content: center;
				align-items: center;
				gap: 0.5rem;
			}
			.vs-text {
				color: #666;
				font-size: 0.8rem;
			}
			.status-icon {
				font-size: 1.2rem;
			}
		`
		document.head.appendChild(style)
	}

	private setupTournamentEvents(): void {
		// Bouton pour rejoindre le tournoi
		const joinBtn = document.getElementById('join-tournament')
		if (joinBtn) {
			joinBtn.addEventListener('click', () => {
				const input = document.getElementById('player-alias') as HTMLInputElement
				if (input && input.value.trim()) {
					const result = this.tournamentManager?.addPlayer(input.value.trim())
					if (result?.success) {
						input.value = ''
						this.renderTournament()
					} else {
						alert(result?.message || 'Failed to add player')
					}
				}
			})
		}

		// Boutons pour ajouter des IA
		const addEasyAI = document.getElementById('add-ai-easy')
		if (addEasyAI) {
			addEasyAI.addEventListener('click', () => {
				const result = this.tournamentManager?.addAI('easy')
				if (result?.success) {
					this.renderTournament()
				} else {
					alert(result?.message || 'Failed to add AI')
				}
			})
		}

		const addMediumAI = document.getElementById('add-ai-medium')
		if (addMediumAI) {
			addMediumAI.addEventListener('click', () => {
				const result = this.tournamentManager?.addAI('medium')
				if (result?.success) {
					this.renderTournament()
				} else {
					alert(result?.message || 'Failed to add AI')
				}
			})
		}

		const addHardAI = document.getElementById('add-ai-hard')
		if (addHardAI) {
			addHardAI.addEventListener('click', () => {
				const result = this.tournamentManager?.addAI('hard')
				if (result?.success) {
					this.renderTournament()
				} else {
					alert(result?.message || 'Failed to add AI')
				}
			})
		}

		// Bouton pour démarrer le tournoi
		const startBtn = document.getElementById('start-tournament')
		if (startBtn) {
			startBtn.addEventListener('click', () => {
				if (this.tournamentManager?.startTournament()) {
					this.renderTournament()
				}
			})
		}

		// Bouton pour reset le tournoi
		const resetBtn = document.getElementById('reset-tournament')
		if (resetBtn) {
			resetBtn.addEventListener('click', () => {
				if (confirm('Reset the tournament? All progress will be lost.')) {
					this.tournamentManager?.reset()
					this.renderTournament()
				}
			})
		}

		// Boutons pour supprimer des joueurs
		document.querySelectorAll('[data-remove-player]').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const playerId = (e.target as HTMLElement).getAttribute('data-remove-player')
				if (playerId && this.tournamentManager?.removePlayer(playerId)) {
					this.renderTournament()
				}
			})
		})

		// Bouton pour démarrer un match
		const startMatchBtn = document.getElementById('start-match')
		if (startMatchBtn) {
			startMatchBtn.addEventListener('click', (e) => {
				const matchId = (e.target as HTMLElement).getAttribute('data-match-id')
				if (matchId) {
					const match = this.tournamentManager?.startMatch(matchId)
					if (match) {
						this.renderTournament()
						setTimeout(() => this.initTournamentGame(match), 0)
					}
				}
			})
		}


		// Bouton pour nouveau tournoi
		const newTournamentBtn = document.getElementById('new-tournament')
		if (newTournamentBtn) {
			newTournamentBtn.addEventListener('click', () => {
				this.tournamentManager?.reset()
				this.renderTournament()
			})
		}
	}

	private initTournamentGame(match: any): void {
		const canvas = document.getElementById('tournament-canvas') as HTMLCanvasElement
		if (!canvas) {
			console.error('Tournament canvas not found!')
			return
		}

		if (this.currentGame) {
			this.currentGame.destroy()
		}

		// Déterminer si le match implique des IA
		const player1IsAI = match.player1.isAI
		const player2IsAI = match.player2.isAI

		// Si les deux sont des IA ou si le joueur de droite est une IA, activer l'IA
		let aiEnabled = false
		let aiDifficulty = AIDifficulty.MEDIUM

		if (player2IsAI) {
			aiEnabled = true
			// Mapper la difficulté de l'IA
			switch (match.player2.aiDifficulty) {
				case 'easy':
					aiDifficulty = AIDifficulty.EASY
					break
				case 'hard':
					aiDifficulty = AIDifficulty.HARD
					break
				default:
					aiDifficulty = AIDifficulty.MEDIUM
			}
		}

		// Si les deux joueurs sont des IA, on simule automatiquement
		if (player1IsAI && player2IsAI) {
			this.simulateAIMatch(match)
			return
		}

		// Créer le jeu avec ou sans IA
		this.currentGame = new PongGame(canvas, aiEnabled, aiDifficulty)

		// Attendre la fin du jeu
		const checkGameEnd = setInterval(() => {
			if (this.currentGame) {
				const score = this.currentGame.getScore()
				// Si un joueur atteint 5 points (condition typique de fin)
				if (score.left >= 5 || score.right >= 5) {
					clearInterval(checkGameEnd)

					// Déterminer le gagnant
					const winnerId = score.left > score.right ? match.player1.id : match.player2.id

					// Enregistrer le résultat
					this.tournamentManager?.endMatch(match.id, winnerId, {
						player1: score.left,
						player2: score.right
					})

					// Nettoyer et revenir à la vue tournoi
					if (this.currentGame) {
						this.currentGame.destroy()
						this.currentGame = null
					}

					setTimeout(() => {
						this.renderTournament()
					}, 2000) // Attendre 2 secondes pour montrer le score final
				}
			} else {
				clearInterval(checkGameEnd)
			}
		}, 100)

		canvas.focus()
		console.log(`🎮 Tournament game ready! ${aiEnabled ? '(vs AI)' : '(vs Player)'}`)
	}

	private simulateAIMatch(match: any): void {
		console.log('🤖 Simulating AI vs AI match...')

		// Simuler un match entre deux IA
		const difficulty1 = match.player1.aiDifficulty || 'medium'
		const difficulty2 = match.player2.aiDifficulty || 'medium'

		// Calculer les probabilités de victoire selon les difficultés
		const strengthMap = { easy: 1, medium: 2, hard: 3 }
		const strength1 = strengthMap[difficulty1 as keyof typeof strengthMap]
		const strength2 = strengthMap[difficulty2 as keyof typeof strengthMap]

		const totalStrength = strength1 + strength2
		const player1WinChance = strength1 / totalStrength

		// Générer un score aléatoire mais réaliste
		const winner = Math.random() < player1WinChance ? match.player1 : match.player2
		const loser = winner.id === match.player1.id ? match.player2 : match.player1

		// Score du gagnant: entre 5 et 7
		const winnerScore = 5 + Math.floor(Math.random() * 3)
		// Score du perdant: entre 0 et 4
		const loserScore = Math.floor(Math.random() * 5)

		const score = winner.id === match.player1.id
			? { player1: winnerScore, player2: loserScore }
			: { player1: loserScore, player2: winnerScore }

		// Afficher le résultat dans la console
		console.log(`🏆 ${winner.alias} wins ${score.player1}-${score.player2} against ${loser.alias}`)

		// Enregistrer le résultat après un court délai
		setTimeout(() => {
			this.tournamentManager?.endMatch(match.id, winner.id, score)
			this.renderTournament()
		}, 1500)
	}
}
