import { PongGame } from './game/PongGame'

export class Router {
    private routes: Map<string, () => void> = new Map()
    private currentGame: PongGame | null = null

    constructor() {
        this.setupRoutes()
    }

    private setupRoutes(): void {
        // Définir les routes
        this.routes.set('/', () => this.renderHome())
        this.routes.set('/game', () => this.renderGame())
        this.routes.set('/tournament', () => this.renderTournament())
    }

    start(): void {
        // Gérer les clics sur les liens
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

        // Gérer les boutons back/forward du navigateur
        window.addEventListener('popstate', () => {
            this.handleRoute()
        })

        // Charger la route initiale
        this.handleRoute()
    }

    navigate(path: string): void {
        // Mettre à jour l'historique du navigateur
        history.pushState({}, '', path)
        this.handleRoute()
    }

    private handleRoute(): void {
    // Nettoyer le jeu quand on quitte la page
    if (this.currentGame && window.location.pathname !== '/game') {
        this.currentGame.destroy() // ✅ Utiliser destroy() au lieu de stop()
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
                    <a href="/game" data-route class="btn btn-primary">
                        🏓 Quick Game
                    </a>
                    <a href="/tournament" data-route class="btn btn-secondary">
                        🏆 Join Tournament
                    </a>
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

        // Initialiser le jeu après que le DOM soit mis à jour
        setTimeout(() => this.initPongGame(), 0)
    }

    private renderTournament(): void {
        this.updatePageContent(`
            <div class="page">
                <h2>🏆 Tournament</h2>
                <p>Tournament system will be implemented here</p>
            </div>
        `)
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

    // Nettoyer le jeu précédent s'il existe
    if (this.currentGame) {
        this.currentGame.destroy() // ✅ Utiliser destroy() au lieu de stop()
    }

    // Créer un nouveau jeu
    this.currentGame = new PongGame(canvas)

    // Donner le focus au canvas pour les contrôles clavier
    setTimeout(() => {
        canvas.focus()
    }, 100)

    console.log('🎮 Pong game ready!')
    }

	private addPageStyles(): void {
		// Vérifier si les styles existent déjà
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
}