// Point d'entrée principal de l'application
import { Router } from './router.ts'
import { App } from './App.ts'

class TranscendenceApp {
    private app: App
    private router: Router

    constructor() {
        console.log('ft_transcendence starting...')

        // Initialiser l'application
        this.app = new App()

        // Initialiser le routeur pour la SPA
        this.router = new Router()

        // Démarrer l'app
        this.start()
    }

    private start(): void {
        // Vérifier que le DOM est chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init())
        } else {
            this.init()
        }
    }

    private init(): void {
        console.log('App initialized')

        // Monter l'application dans le DOM
        this.app.mount('#app')

        // Démarrer le routeur
        this.router.start()
    }
}

// Lancer l'application
new TranscendenceApp()