export class App {
    private container: HTMLElement | null = null

    mount(selector: string): void {
        this.container = document.querySelector(selector)

        if (!this.container) {
            throw new Error(`Container ${selector} not found`)
        }

        this.render()
    }

    private render(): void {
        if (!this.container) return

        this.container.innerHTML = `
            <header class="app-header">
                <nav class="nav">
                    <h1>ft_transcendence</h1>
                    <ul class="nav-links">
                        <li><a href="/" data-route>Home</a></li>
                        <li><a href="/game" data-route>Play</a></li>
                        <li><a href="/tournament" data-route>Tournament</a></li>
                    </ul>
                </nav>
            </header>

            <main class="app-main" id="page-content">
                <!-- Le contenu des pages sera injecté ici -->
            </main>

            <footer class="app-footer">
                <p>42 Project - Pong Tournament Platform</p>
            </footer>
        `

        this.addStyles()
    }

    private addStyles(): void {
        const style = document.createElement('style')
        style.textContent = `
            .app-header {
                background: #1a1a1a;
                padding: 1rem;
                border-bottom: 2px solid #333;
            }

            .nav {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
            }

            .nav h1 {
                color: #00ff41;
                font-size: 1.5rem;
            }

            .nav-links {
                display: flex;
                list-style: none;
                gap: 2rem;
            }

            .nav-links a {
                color: #fff;
                text-decoration: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .nav-links a:hover {
                background: #333;
            }

            .app-main {
                flex: 1;
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
                width: 100%;
            }

            .app-footer {
                background: #1a1a1a;
                text-align: center;
                padding: 1rem;
                border-top: 2px solid #333;
                color: #666;
            }
        `
        document.head.appendChild(style)
    }
}