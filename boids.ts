type CollisionDetector = (circle: Circle) => boolean

class Vector2D implements Vector2DLike {
  x: number
  y: number

  constructor(x: number | Vector2DLike, y?: number) {
    if (typeof (x) === 'number') {
      this.x = x
      this.y = y
    } else {
      this.x = x.x
      this.y = x?.y ?? y
    }
  }

  add(vector: Vector2DLike): void {
    this.x += vector.x
    this.y += vector.y
  }

  added(vector: Vector2DLike): Vector2D {
    return new Vector2D(this.x + vector.x, this.y + vector.y)
  }

  get collisionDetector(): CollisionDetector {
    return circle => circle.doesCollide(this)
  }

  copyTo(other: Vector2DLike): void {
    other.x = this.x
    other.y = this.y
  }

  crossProduct(vector: Vector2DLike): number {
    return this.x * vector.y - this.y * vector.x
  }

  divide(divisor: number): void {
    this.x /= divisor
    this.y /= divisor
  }

  dividedBy(divisor: number): Vector2D {
    return new Vector2D(this.x / divisor, this.y / divisor)
  }

  dotProduct(vector: Vector2DLike): number {
    return this.x * vector.x + this.y * vector.y
  }

  from(vector: Vector2DLike): Vector2D {
    return new Vector2D(this.x - vector.x, this.y - vector.y)
  }

  get length(): number {
    return Math.hypot(this.x, this.y)
  }

  get squareOfLength(): number {
    return this.dotProduct(this)
  }

  get retrorse(): Vector2D {
    return new Vector2D(-this.x, -this.y)
  }

  rotate(radian: number): void {
    const [c, s, x, y] = [Math.cos(radian), Math.sin(radian), this.x, this.y]
    this.x = x * c - y * s
    this.y = x * s + y * c
  }

  rotatedBy(radian: number): Vector2D {
    const [c, s] = [Math.cos(radian), Math.sin(radian)]
    return new Vector2D(this.x * c - this.y * s, this.x * s + this.y * c)
  }

  scale(scale: number): void {
    this.x *= scale
    this.y *= scale
  }

  scaledBy(scale: number): Vector2D {
    return new Vector2D(this.x * scale, this.y * scale)
  }

  sub(vector: Vector2DLike): void {
    this.x -= vector.x
    this.y -= vector.y
  }
}

type Vector2DLike = {
  x: number
  y: number
}

abstract class Acceleration extends Vector2D {
  protected count: number = 0

  constructor() {
    super(0, 0)
  }

  add(vector: Vector2DLike): void {
    super.add(vector)
    this.count++
  }

  effectTo(vector: Vector2D): void {
    if (this.count)
      vector.add(this.dividedBy(this.count))
  }

  abstract match(relationship: BoidRelationship): boolean
}

abstract class Deceleration extends Acceleration {
  add(vector: Vector2DLike): void {
    super.sub(vector)
    this.count++
  }
}

class AvoidanceDeceleration extends Deceleration {
  match(relationship: BoidRelationship): boolean {
    const matched = relationship.distance < 12
    if (matched)
      this.add(relationship.vector.dividedBy(relationship.distance * 4))
    return matched
  }
}

class FarAcceleration extends Acceleration {
  match(relationship: BoidRelationship): boolean {
    const distance = relationship.distance
    for (let i = 0; i < 4; i++)
      if (distance < 48 + i * 24) {
        this.add(relationship.vector.dividedBy(distance * (i + 1) * 8))
        return true
      }
  }
}

class SpreadAcceleration extends Acceleration {
  constructor(private readonly spread: number) {
    super()
  }

  match(relationship: BoidRelationship): boolean {
    const matched = relationship.distance < this.spread
    if (matched) {
      const boid = relationship.relationalBoid
      this.add(boid.velocity.dividedBy(boid.speed * 32))
    }
    return matched
  }
}

class Boid {
  readonly position: Vector2D
  readonly velocity: Vector2D

  constructor(private readonly all: Boid[], private readonly canvas: HTMLCanvasElement, private readonly circles: Circle[], private readonly context: CanvasRenderingContext2D, private readonly index: number) {
    do {
      const x = 20 + Math.random() * (canvas.width - 40)
      const y = 20 + Math.random() * (canvas.height - 40)
      this.position = new Vector2D(x, y)
    } while (circles.some(this.position.collisionDetector))
    this.velocity = new Vector2D(1 - Math.random() * 2, 1 - Math.random() * 2)
  }

  private avoidCircles(): void {
    for (const c of this.circles.filter(this.position.collisionDetector)) {
      this.position.sub(this.velocity)
      const p = c.intersectingPoint(this)
      p?.rotate(this) ?? (this.position.from(c.center).copyTo(this.velocity), this.normalize())
      this.position.add(this.velocity)
    }
  }

  draw(): void {
    this.context.beginPath()
    this.context.fillStyle = 'rgb(255, 128, 0)'
    this.context.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2, true)
    this.context.fill()
  }

  drawCanvas(): void {
    this.context.fillStyle = "rgba(0, 0, 0, .1)"
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawCircles(): void {
    this.circles.forEach(circle => circle.draw())
  }

  set globalCompositeOperation(operation: GlobalCompositeOperation) {
    this.context.globalCompositeOperation = operation
  }

  move(): void {
    this.position.add(this.velocity)
    this.avoidCircles()
    this.turnOverByEdgeOfCanvas()
  }

  get nextPoint(): Vector2D {
    return this.position.added(this.velocity)
  }

  normalize(): void {
    const limit = 0.8 + Math.random() * 1.2
    const speed = this.speed
    if (limit < speed)
      this.velocity.scale(limit / speed)
  }

  get others(): Boid[] {
    return this.all.filter((_, index) => index != this.index)
  }

  get speed(): number {
    return this.velocity.length
  }

  private turnOverByEdgeOfCanvas(): void {
    if (this.position.x < 0) {
      this.position.x = 0
      this.velocity.x = Math.abs(this.velocity.x)
    }
    if (this.canvas.width < this.position.x) {
      this.position.x = this.canvas.width
      this.velocity.x = -Math.abs(this.velocity.x)
    }
    if (this.position.y < 0) {
      this.position.y = 0
      this.velocity.y = Math.abs(this.velocity.y)
    }
    if (this.canvas.height < this.position.y) {
      this.position.y = this.canvas.height
      this.velocity.y = -Math.abs(this.velocity.y)
    }
  }

  update(): void {
    const effects = [
      new AvoidanceDeceleration(),
      new SpreadAcceleration(16 + Math.random() * 8),
      new FarAcceleration(),
    ]
    for (const boid of this.others) {
      const relationship = new BoidRelationship(this, boid)
      effects.find(e => e.match(relationship))
    }
    for (const e of effects)
      e.effectTo(this.velocity)
  }
}

class BoidRelationship {
  readonly distance: number
  readonly vector: Vector2D

  constructor(readonly baseBoid: Boid, readonly relationalBoid: Boid) {
    this.vector = relationalBoid.position.from(baseBoid.position)
    this.distance = this.vector.length
  }
}

function within(lower: number, higher: number) {
  return (value: number) => lower <= value && value <= higher
}

class Circle {
  readonly center: Vector2D

  constructor(private readonly context: CanvasRenderingContext2D, x: number, y: number, readonly radius: number = 100, readonly color: string = 'rgba(32, 32, 48, .5)') {
    this.center = new Vector2D(x, y)
  }

  private amplitude(time: number, boid: Boid): number {
    const next = boid.position.added(boid.velocity.scaledBy(time))
    const [v1, v2] = [boid.nextPoint, this.center].map(v => v.from(next))
    return Math.acos(v1.dotProduct(v2) / (v1.length * v2.length))
  }

  draw(): void {
    this.context.beginPath()
    this.context.fillStyle = this.color
    this.context.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, true)
    this.context.fill()
  }

  doesCollide(pos: Vector2DLike): boolean {
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

class IntersectingPoint {
  private readonly rotation: number

  constructor(amplitude: number) {
    this.rotation = Math.PI - (amplitude * 2 <= Math.PI ? 2 : 1) * amplitude
  }

  rotate(boid: Boid): boolean {
    boid.velocity.rotate(this.rotation)
    return true
  }
}

function addOrRemoveCircle(circles: Circle[], context: CanvasRenderingContext2D, event: any): void {
  const r = event.target.getBoundingClientRect()
  const p = new Vector2D(event.clientX, event.clientY).from(new Vector2D(r.left, r.top))
  const found = circles.filter(p.collisionDetector)
  for (const circle of found) {
    const index = circles.indexOf(circle)
    circles.splice(index, 1)
  }
  if (found.length == 0)
    circles.push(new Circle(context, p.x, p.y))
}

function updateBoids(boids: Boid[]): void {
  const boid = boids[0]
  boid.globalCompositeOperation = "source-over"
  boid.drawCanvas()
  boid.drawCircles()
  boid.globalCompositeOperation = "lighter"
  for (const boid of boids) {
    boid.draw()
    boid.update()
  }
  for (const boid of boids) {
    boid.normalize()
    boid.move()
  }
}

function generateBoids(param: { id: string, num: number }) {
  const canvas = document.getElementById(param.id) as HTMLCanvasElement
  const context = canvas.getContext('2d')
  const circles: Circle[] = []
  for (let i = 0; i < 1; i++) {
    const x = 100 + Math.random() * (canvas.width - 200)
    const y = 100 + Math.random() * (canvas.height - 200)
    circles.push(new Circle(context, x, y))
  }
  const boids: Boid[] = []
  for (let i = 0; i < param.num; i++)
    boids.push(new Boid(boids, canvas, circles, context, i))
  canvas.onmouseup = event => addOrRemoveCircle(circles, context, event)
  return { boids: boids, update: updateBoids }
}
