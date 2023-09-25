import { Circle, CollisionDetector, Vector2DLike, isVector2DLike } from '..'

export class Vector2D implements Vector2DLike {
  private $dirty: boolean
  private $length: number
  private $squareOfLength: number
  private $x: number
  private $y: number

  constructor(v: Readonly<Vector2DLike>)
  constructor(v: Vector2D)
  constructor(x: number, y: number)
  constructor(a: Readonly<Vector2DLike> | Vector2D | number, b?: number) {
    if (a instanceof Vector2D) {
      this.$dirty = a.$dirty
      this.$length = a.$length
      this.$squareOfLength = a.$squareOfLength
      this.$x = a.x
      this.$y = a.y
    }
    else {
      this.$dirty = true
      if (isVector2DLike(a)) {
        this.$x = a.x
        this.$y = a.y
      }
      else {
        this.$x = a
        this.$y = b
      }
    }
  }

  add(vector: Vector2D): void {
    this.$dirty = true
    this.$x += vector.x
    this.$y += vector.y
  }

  added(vector: Vector2D): Vector2D {
    return new Vector2D(this.$x + vector.x, this.$y + vector.y)
  }

  get clone(): Vector2D {
    return new Vector2D(this)
  }

  get collisionDetector(): CollisionDetector {
    return (circle: Circle) => circle.doesCollide(this)
  }

  copyTo(other: Vector2D): void {
    other.$dirty = this.$dirty
    other.$length = this.$length
    other.$squareOfLength = this.$squareOfLength
    other.$x = this.$x
    other.$y = this.$y
  }

  crossProduct(vector: Vector2D): number {
    return this.$x * vector.y - this.$y * vector.x
  }

  divide(divisor: number): void {
    if (!this.$dirty) {
      this.$length /= divisor
      this.$squareOfLength /= divisor * divisor
    }
    this.$x /= divisor
    this.$y /= divisor
  }

  dividedBy(divisor: number): Vector2D {
    const v = this.clone
    if (!v.$dirty) {
      v.$length /= divisor
      v.$squareOfLength /= divisor * divisor
    }
    v.$x /= divisor
    v.$y /= divisor
    return v
  }

  dotProduct(vector: Vector2D): number {
    return this.$x * vector.x + this.$y * vector.y
  }

  from(vector: Vector2D): Vector2D {
    return new Vector2D(this.$x - vector.x, this.$y - vector.y)
  }

  get length(): number {
    if (this.$dirty) {
      this.$dirty = false
      this.$length = Math.hypot(this.$x, this.$y)
      this.$squareOfLength = this.dotProduct(this)
    }
    return this.$length
  }

  get squareOfLength(): number {
    if (this.$dirty) {
      this.$dirty = false
      this.$length = Math.hypot(this.$x, this.$y)
      this.$squareOfLength = this.dotProduct(this)
    }
    return this.$squareOfLength
  }

  get retrorse(): Vector2D {
    const v = this.clone
    v.$x = -v.$x
    v.$y = -v.$y
    return v
  }

  rotate(radian: number): void {
    const [c, s, x, y] = [Math.cos(radian), Math.sin(radian), this.$x, this.$y]
    this.$x = x * c - y * s
    this.$y = x * s + y * c
  }

  rotatedBy(radian: number): Vector2D {
    const [c, s] = [Math.cos(radian), Math.sin(radian)]
    const x = this.$x * c - this.$y * s
    const y = this.$x * s + this.$y * c
    const v = this.clone
    v.$x = x
    v.$y = y
    return v
  }

  scale(scale: number): void {
    if (!this.$dirty) {
      this.$length *= scale
      this.$squareOfLength *= scale * scale
    }
    this.$x *= scale
    this.$y *= scale
  }

  scaledBy(scale: number): Vector2D {
    const v = this.clone
    if (!this.$dirty) {
      v.$length *= scale
      v.$squareOfLength *= scale * scale
    }
    v.$x *= scale
    v.$y *= scale
    return v
  }

  sub(vector: Vector2D): void {
    this.$dirty = true
    this.$x -= vector.x
    this.$y -= vector.y
  }

  get x(): number {
    return this.$x
  }

  set x(value: number) {
    this.$dirty = true
    this.$x = value
  }

  get y(): number {
    return this.$y
  }

  set y(value: number) {
    this.$dirty = true
    this.$y = value
  }
}
