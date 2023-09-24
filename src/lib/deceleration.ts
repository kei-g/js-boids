import { Acceleration, BoidRelationship, Vector2D } from '..'

export abstract class Deceleration<T> extends Acceleration<T> {
  add(vector: Vector2D): void
  add(relationship: BoidRelationship, arg: T): void
  add(value: BoidRelationship | Vector2D, arg?: T): void {
    value instanceof BoidRelationship ? super.sub(value, arg) : super.sub(value)
  }
}
