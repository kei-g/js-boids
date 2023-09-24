import { Boid, Vector2D } from '..'

export class BoidRelationship {
  readonly distance: number
  readonly vector: Vector2D

  constructor(baseBoid: Boid, readonly relationalBoid: Boid) {
    this.vector = relationalBoid.position.from(baseBoid.position)
    this.distance = this.vector.length
  }
}
