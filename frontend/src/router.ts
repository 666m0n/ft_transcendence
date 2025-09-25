import { PongGame } from './game/PongGame'

export class Router {
	private routes: Map<string, () => void> = new Map()
	private currentGame: PongGame | null = null
	private tournamentManager: TournamentManager | null = null

	constructor() {
		this.setupRoutes()
	}

	private setupRoutes(): void {
		this.routes.set('/', () => this.renderHome())
		this.routes.set('/game', () => this.renderGame())
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
		this.updatePageContent(`
			<div class="page">
				<h2>🎮 Welcome to ft_transcendence</h2>
				<p>The ultimate Pong tournament platform!</p>
				<div class="actions">
					<a href="/game" data-route class="btn btn-primary">🏓 Quick Game</a>
					<a href="/tournament" data-route class="btn btn-secondary">🏆 Join Tournament</a>
				</div>
			</div>
		`)
	}

	private renderGame(): void {
		this.updatePageContent(`
			<div class="page">
				<h2>🏓 Pong Game</h2>
				<div class="game-container">
					<canvas id="pong-canvas"></canvas>
				</div>
				<div class="game-info">
					<p>🎮 <strong>Controls:</strong></p>
					<p>Left Player: <kbd>W</kbd> / <kbd>S</kbd></p>
					<p>Right Player: <kbd>↑</kbd> / <kbd>↓</kbd></p>
					<p>Press <kbd>SPACE</kbd> to start!</p>
				</div>
			</div>
		`)
		setTimeout(() => this.initPongGame(), 0)
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
		return `
			<div class="tournament-section">
				<h3>📝 Player Registration</h3>
				<p>Players: ${state.players.length}/${state.maxPlayers}</p>
				<div class="registration-form">
					<input type="text" id="player-alias" placeholder="Enter your alias..." maxlength="20" autocomplete="off">
					<button id="join-tournament" class="btn btn-primary">Join Tournament</button>
				</div>
				<div class="players-list">
					<h4>👥 Registered Players:</h4>
					${state.players.length === 0 ?
						'<p class="empty-state">No players yet. Be the first to join!</p>' :
						state.players.map((player: any) => `
							<div class="player-item">
								<span class="player-alias">🎮 ${player.alias}</span>
								<button class="btn-small btn-danger" data-remove-player="${player.id}">Remove</button>
							</div>
						`).join('')
					}
				</div>
				${state.players.length >= 2 ? `
					<div class="tournament-actions">
						<button id="start-tournament" class="btn btn-success">
							🚀 Start Tournament (${state.players.length} players)
						</button>
					</div>
				` : `
					<p class="info-message">Need at least 2 players to start</p>
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
					<div class="match-controls">
						<button id="end-match" class="btn btn-danger">⏹️ End Match</button>
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

	private renderBracket(state: any): string {
		const rounds = this.tournamentManager?.getRounds() || 0
		if (rounds === 0) return ''

		let bracketHtml = '<div class="tournament-bracket"><h4>📊 Tournament Bracket</h4>'
		for (let round = 1; round <= rounds; round++) {
			const matches = this.tournamentManager?.getMatchesForRound(round) || []
			bracketHtml += `
				<div class="bracket-round">
					<h5>Round ${round}</h5>
					${matches.map(match => `
						<div class="bracket-match ${match.status}">
							<div class="match-players">
								<span class="${match.winner?.id === match.player1.id ? 'winner' : ''}">${match.player1.alias}</span>
								<span class="score">${match.score.player1} - ${match.score.player2}</span>
								<span class="${match.winner?.id === match.player2.id ? 'winner' : ''}">${match.player2.alias}</span>
							</div>
							<div class="match-status">${match.status}</div>
						</div>
					`).join('')}
				</div>
			`
		}
		bracketHtml += '</div>'
		return bracketHtml
	}

	private updatePageContent(html: string): void {
		const container = document.getElementById('page-content')
		if (container) {
			container.innerHTML = html
			this.addPageStyles()
		}
	}

	private initPongGame(): void {
		const canvas = document.getElementById('pong-canvas') as HTMLCanvasElement
		if (!canvas) {
			console.error('Canvas not found!')
			return
		}
		if (this.currentGame) {
			this.currentGame.destroy()
		}
		this.currentGame = new PongGame(canvas)
		setTimeout(() => {
			canvas.focus()
		}, 100)
		console.log('🎮 Pong game ready!')
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
		`
		document.head.appendChild(style)
	}

	// À compléter : setupTournamentEvents() et autres méthodes nécessaires
}
