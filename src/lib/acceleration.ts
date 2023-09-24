import { Vector2D } from './vector2d'
import { BoidRelationship } from '..'

export abstract class Acceleration<T> extends Vector2D {
  protected count: number
  readonly #matched = [] as BoidRelationship[]

  constructor() {
    super(0, 0)
    this.count = 0
  }

  add(vector: Vector2D): void
  add(relationship: BoidRelationship, arg: T): void
  add(value: BoidRelationship | Vector2D, arg?: T): void {
    if (value instanceof BoidRelationship) {
      super.add(this.resolve(value, arg))
      this.#matched.push(value)
      this.count++
    }
    else
      super.add(value)
  }

  effectTo(vector: Vector2D): void {
    if (this.count)
      vector.add(this.dividedBy(this.count))
  }

  abstract match(relationship: BoidRelationship): boolean

  get matched(): Iterable<BoidRelationship> {
    return this.#matched
  }

  abstract resolve(relationship: BoidRelationship, arg: T): Vector2D

  sub(vector: Vector2D): void
  sub(relationship: BoidRelationship, arg: T): void
  sub(value: BoidRelationship | Vector2D, arg?: T): void {
    if (value instanceof BoidRelationship) {
      super.sub(this.resolve(value, arg))
      this.#matched.push(value)
      this.count++
    }
    else
      super.sub(value)
  }
}
