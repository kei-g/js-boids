import { Acceleration, BoidRelationship, Vector2D } from '..'

export class FarAcceleration extends Acceleration<number> {
  match(relationship: BoidRelationship): boolean {
    const distance = relationship.distance
    for (let i = 0; i < 4; i++)
      if (distance < 48 + i * 24) {
        this.add(relationship, i)
        return true
      }
  }

  resolve(relationship: BoidRelationship, i: number): Vector2D {
    return relationship.vector.dividedBy(relationship.distance * (i + 1) * 8)
  }
}
