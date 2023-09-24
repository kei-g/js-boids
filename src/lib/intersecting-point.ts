import { Boid } from '..'

export class IntersectingPoint {
  private readonly rotation: number

  constructor(amplitude: number) {
    this.rotation = Math.PI - (amplitude * 2 <= Math.PI ? 2 : 1) * amplitude
  }

  rotate(boid: Boid): boolean {
    boid.velocity.rotate(this.rotation)
    return true
  }
}
