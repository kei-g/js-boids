import { Deceleration } from './deceleration'
import { BoidRelationship, Vector2D } from '..'

export class AvoidanceDeceleration extends Deceleration<void> {
  match(relationship: BoidRelationship): boolean {
    const matched = relationship.distance < 12
    if (matched)
      this.add(relationship)
    return matched
  }

  resolve(relationship: BoidRelationship): Vector2D {
    return relationship.vector.dividedBy(relationship.distance * 4)
  }
}
