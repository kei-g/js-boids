import { Acceleration, BoidRelationship, Vector2D } from '..'

export class SpreadAcceleration extends Acceleration<void> {
  constructor(private readonly spread: number) {
    super()
  }

  match(relationship: BoidRelationship): boolean {
    const matched = relationship.distance < this.spread
    if (matched)
      this.add(relationship)
    return matched
  }

  resolve(relationship: BoidRelationship): Vector2D {
    const boid = relationship.relationalBoid
    return boid.velocity.dividedBy(boid.speed * 32)
  }
}
