import { Vector2D, GameConfig } from './types'

export class Ball {
    public position: Vector2D
    public velocity: Vector2D
    public size: number

    constructor(
        private config: GameConfig,
        startPosition: Vector2D
    ) {
        this.position = { ...startPosition }
        this.size = config.ballSize

        // Direction aléatoire au départ
        const direction = Math.random() > 0.5 ? 1 : -1
        const angle = (Math.random() - 0.5) * Math.PI / 3 // Angle entre -30° et 30°

        this.velocity = {
            x: direction * config.ballSpeed * Math.cos(angle),
            y: config.ballSpeed * Math.sin(angle)
        }
    }

    update(deltaTime: number): void {
        // Mettre à jour la position
        this.position.x += this.velocity.x * deltaTime
        this.position.y += this.velocity.y * deltaTime

        // Collision avec le haut/bas
        if (this.position.y <= this.size/2) {
            this.position.y = this.size/2
            this.velocity.y = -this.velocity.y
        }

        if (this.position.y >= this.config.height - this.size/2) {
            this.position.y = this.config.height - this.size/2
            this.velocity.y = -this.velocity.y
        }
    }

    reset(): void {
        // Remettre au centre
        this.position = {
            x: this.config.width / 2,
            y: this.config.height / 2
        }

        // Nouvelle direction aléatoire
        const direction = Math.random() > 0.5 ? 1 : -1
        const angle = (Math.random() - 0.5) * Math.PI / 3

        this.velocity = {
            x: direction * this.config.ballSpeed * Math.cos(angle),
            y: this.config.ballSpeed * Math.sin(angle)
        }
    }

    // Vérifier si la balle sort des limites
    isOutOfBounds(): 'left' | 'right' | null {
        if (this.position.x < -this.size) return 'left'
        if (this.position.x > this.config.width + this.size) return 'right'
        return null
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, this.size/2, 0, Math.PI * 2)
        ctx.fill()
    }
}