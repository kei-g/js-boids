import { Boid, IntersectingPoint, Vector2D } from '..'

export class Circle {
  readonly center: Vector2D

  constructor(x: number, y: number, readonly radius: number = 100, readonly color: string = 'rgba(32, 32, 48, .5)') {
    this.center = new Vector2D(x, y)
  }

  private amplitude(time: number, boid: Boid): number {
    const next = boid.position.added(boid.velocity.scaledBy(time))
    const [v1, v2] = [boid.nextPoint, this.center].map(v => v.from(next))
    return Math.acos(v1.dotProduct(v2) / (v1.length * v2.length))
  }

  draw(context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.fillStyle = this.color
    context.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, true)
    context.fill()
    context.closePath()
  }

  doesCollide(pos: Vector2D): boolean {
    const v = this.center.from(pos)
    return v.length <= this.radius
  }

  intersectingPoint(boid: Boid): IntersectingPoint {
    const vector = boid.position.from(this.center)
    const length = boid.velocity.squareOfLength
    const a = -boid.velocity.dotProduct(vector)
    const b = vector.squareOfLength - this.squareOfRadius
    const c = a * a - length * b
    if (0 <= c) {
      const d = Math.sqrt(c)
      const t = [(a + d) / length, (a - d) / length]
      if (t.some(within(0, 1)))
        return new IntersectingPoint(this.amplitude(t[0], boid))
    }
  }

  get squareOfRadius(): number {
    return this.radius * this.radius
  }
}

const within = (lower: number, higher: number) => (value: number) => lower <= value && value <= higher
