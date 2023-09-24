type CollisionDetector = (circle: Circle) => boolean

class Vector2D {
  private $dirty: boolean
  private $length: number
  private $x: number
  private $y: number

  constructor(v: Vector2D)
  constructor(x: number, y: number)
  constructor(a: Vector2D | number, b?: number) {
    if (typeof (a) === 'number') {
      this.$dirty = true
      this.$x = a
      this.$y = b
    }
    else {
      this.$dirty = a.$dirty
      this.$length = a.$length
      this.$x = a.x
      this.$y = a.y
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
    return circle => circle.doesCollide(this)
  }

  copyTo(other: Vector2D): void {
    other.$dirty = this.$dirty
    other.$length = this.$length
    other.$x = this.$x
    other.$y = this.$y
  }

  crossProduct(vector: Vector2D): number {
    return this.$x * vector.y - this.$y * vector.x
  }

  divide(divisor: number): void {
    if (!this.$dirty)
      this.$length /= divisor
    this.$x /= divisor
    this.$y /= divisor
  }

  dividedBy(divisor: number): Vector2D {
    const v = this.clone
    if (!v.$dirty)
      v.$length /= divisor
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
    }
    return this.$length
  }

  get squareOfLength(): number {
    return this.dotProduct(this)
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
    if (!this.$dirty)
      this.$length *= scale
    this.$x *= scale
    this.$y *= scale
  }

  scaledBy(scale: number): Vector2D {
    const v = this.clone
    if (!this.$dirty)
      v.$length *= scale
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

abstract class Acceleration<T> extends Vector2D {
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

abstract class Deceleration<T> extends Acceleration<T> {
  add(vector: Vector2D): void
  add(relationship: BoidRelationship, arg: T): void
  add(value: BoidRelationship | Vector2D, arg?: T): void {
    value instanceof BoidRelationship ? super.sub(value, arg) : super.sub(value)
  }
}

class AvoidanceDeceleration extends Deceleration<void> {
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

class FarAcceleration extends Acceleration<number> {
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

class SpreadAcceleration extends Acceleration<void> {
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

class Boid {
  static #intervalId: NodeJS.Timeout
  static #numberOfBoids: number

  static readonly all = [] as Boid[]
  static readonly circles = [] as Circle[]

  static #update(): void {
    const canvas = document.getElementById('boids') as HTMLCanvasElement
    const context = canvas.getContext('2d')
    context.globalCompositeOperation = 'source-over'
    context.fillStyle = 'rgba(0, 0, 0, .1)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    for (const circle of Boid.circles)
      circle.draw(context)
    context.globalCompositeOperation = 'lighter'
    const alive = new Set<Boid>()
    for (const boid of Boid.all) {
      boid.draw(context)
      boid.update()
      if (boid.degrees.suffocation < 128)
        alive.add(boid)
    }
    updateUI(alive)
    Boid.all.splice(0)
    Boid.all.push(...alive)
    for (const boid of Boid.all) {
      boid.normalize()
      boid.move(canvas.width, canvas.height)
    }
  }

  static generate(): void {
    if (Boid.#intervalId !== undefined)
      clearInterval(Boid.#intervalId)
    Boid.all.splice(0)
    const canvas = document.getElementById('boids') as HTMLCanvasElement
    const nob = document.getElementById('number-of-boids') as HTMLInputElement
    const mnb = document.getElementById('max-number-of-boids') as HTMLInputElement
    const numberOfBoids = clamp(parseInt(nob.value), 1, parseInt(mnb.value), 100)
    nob.value = numberOfBoids.toString()
    for (let i = 0; i < numberOfBoids; i++) {
      const r = Math.floor(Math.random() * 2)
      const ctor = [Boid, BlueBoid][r]
      Boid.all.push(new ctor(canvas))
    }
    Boid.#intervalId = setInterval(Boid.#update, 25)
    Boid.#numberOfBoids = numberOfBoids
  }

  static get numberOfBoids(): number {
    return Boid.#numberOfBoids
  }

  private readonly backup = new Vector2D(0, 0)
  readonly degrees = {
    suffocation: 0,
  }
  readonly position: Vector2D
  readonly velocity: Vector2D

  constructor(canvas: HTMLCanvasElement) {
    do {
      const x = 20 + Math.random() * (canvas.width - 40)
      const y = 20 + Math.random() * (canvas.height - 40)
      this.position = new Vector2D(x, y)
    } while (Boid.circles.some(this.position.collisionDetector))
    this.velocity = new Vector2D(1 - Math.random() * 2, 1 - Math.random() * 2)
  }

  private avoidCircles(): void {
    for (const c of Boid.circles.filter(this.position.collisionDetector)) {
      this.position.sub(this.velocity)
      const p = c.intersectingPoint(this)
      p?.rotate(this) ?? (this.position.from(c.center).copyTo(this.velocity), this.normalize())
      this.position.add(this.velocity)
    }
  }

  get color(): string {
    return [this.colorForRed, this.colorForGreen, this.colorForBlue].join(',')
  }

  get colorForBlue(): number {
    return 0
  }

  get colorForGreen(): number {
    return Math.min(Math.max(0, 255 - this.degrees.suffocation ** 1.125), 128)
  }

  get colorForRed(): number {
    return 255
  }

  draw(context: CanvasRenderingContext2D): void {
    context.beginPath()
    context.fillStyle = `rgb(${this.color})`
    context.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2, true)
    context.fill()
    context.closePath()
  }

  get isSuffocating(): boolean {
    return 0 < this.degrees.suffocation
  }

  move(width: number, height: number): void {
    this.nextPoint.copyTo(this.position)
    this.avoidCircles()
    this.turnOverByEdgeOfCanvas(width, height)
    this.updateSuffocation()
  }

  get nextPoint(): Vector2D {
    return this.position.added(this.nextVelocity)
  }

  get nextVelocity(): Vector2D {
    return this.velocity.added(this.backup).dividedBy(2)
  }

  normalize(): void {
    const limit = 0.8 + Math.random() * 1.2
    const speed = this.speed
    if (limit < speed)
      this.velocity.scale(limit / speed)
  }

  get others(): Boid[] {
    return Boid.all.filter((boid: Boid) => boid !== this)
  }

  get speed(): number {
    return this.velocity.length
  }

  private turnOverByEdgeOfCanvas(width: number, height: number): void {
    if (this.position.x < 0) {
      this.position.x = 0
      this.velocity.x = Math.abs(this.velocity.x)
    }
    if (width < this.position.x) {
      this.position.x = width
      this.velocity.x = -Math.abs(this.velocity.x)
    }
    if (this.position.y < 0) {
      this.position.y = 0
      this.velocity.y = Math.abs(this.velocity.y)
    }
    if (height < this.position.y) {
      this.position.y = height
      this.velocity.y = -Math.abs(this.velocity.y)
    }
  }

  update(): void {
    this.velocity.copyTo(this.backup)
    const avoidance = new AvoidanceDeceleration()
    const effects = [
      avoidance,
      new SpreadAcceleration(16 + Math.random() * 8),
      new FarAcceleration(),
    ]
    for (const boid of this.others) {
      const relationship = new BoidRelationship(this, boid)
      effects.find(e => e.match(relationship))
    }
    const delta = { suffocation: 0 }
    for (const relationship of avoidance.matched) {
      delta.suffocation = 0.03125
      relationship.relationalBoid.degrees.suffocation += 0.03125
    }
    this.degrees.suffocation += delta.suffocation
    for (const e of effects)
      e.effectTo(this.velocity)
  }

  private updateSuffocation(): void {
    this.degrees.suffocation += [-0.125, 1][+Boid.circles.some((circle: Circle) => circle.doesCollide(this.position))]
    this.degrees.suffocation = Math.max(0, this.degrees.suffocation)
  }
}

class BlueBoid extends Boid {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
  }

  get colorForBlue(): number {
    return Math.min(Math.max(0, 255 - this.degrees.suffocation ** 1.125), 255)
  }

  get colorForGreen(): number {
    return Math.min(Math.max(0, 255 - this.degrees.suffocation ** 1.125), 128)
  }

  get colorForRed(): number {
    return Math.max(0, Math.min(this.degrees.suffocation * 255 / 128, 255))
  }
}

class BoidRelationship {
  readonly distance: number
  readonly vector: Vector2D

  constructor(baseBoid: Boid, readonly relationalBoid: Boid) {
    this.vector = relationalBoid.position.from(baseBoid.position)
    this.distance = this.vector.length
  }
}

class Circle {
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

const addOrRemoveCircle = (event: MouseEvent): void => {
  const c = event.target as unknown as HTMLCanvasElement
  const r = c.getBoundingClientRect()
  const v = new Vector2D(event.x, event.y).from(new Vector2D(r.left, r.top))
  const { x } = v.scaledBy(c.width / r.width)
  const { y } = v.scaledBy(c.height / r.height)
  const p = new Vector2D(x, y)
  const found = Boid.circles.filter(p.collisionDetector)
  for (const circle of found) {
    const index = Boid.circles.indexOf(circle)
    Boid.circles.splice(index, 1)
  }
  if (found.length == 0)
    Boid.circles.push(new Circle(p.x, p.y))
}

const areAnyoneSuffocating = (boids: Iterable<Boid>): boolean => [...boids].some((boid: Boid) => boid.isSuffocating)

const clamp = (value: number, lower: number, upper: number, alternate: number) => isNaN(value) ? alternate : Math.max(lower, Math.min(value, upper))

const domContentLoaded = () => {
  const canvas = document.getElementById('boids') as HTMLCanvasElement
  canvas.addEventListener('mouseup', addOrRemoveCircle)

  const applySize = (): void => (canvas.height = canvas.clientHeight, canvas.width = canvas.clientWidth, undefined)
  applySize()
  window.addEventListener('resize', applySize)

  Boid.generate()
  const resetButton = document.getElementById('reset-button')
  resetButton.addEventListener('click', Boid.generate)
}

const summarize = <T>(source: Iterable<T>) => (selector: (value: T) => number) => {
  const ctx = { count: 0, sum: 0 }
  for (const value of source)
    ctx.sum += selector(value)
  return ctx
}

const updateUI = (alive: Set<Boid>): void => {
  const living = document.getElementById('number-of-living-boids') as HTMLSpanElement
  const health = document.getElementById('health-of-living-boids') as HTMLSpanElement
  if (alive.size) {
    const { numberOfBoids } = Boid
    const statusIndex = Math.floor(alive.size * 3 / numberOfBoids)
    const status = ['bad', 'not-good', 'good', 'perfect'][statusIndex]
    const { sum } = summarize(alive)((boid: Boid) => 128 - boid.degrees.suffocation)
    living.setAttribute('face', [status, 'warn'][+(1 < statusIndex && areAnyoneSuffocating(alive))])
    living.setAttribute('status', status)
    living.textContent = alive.size.toString()
    health.textContent = '\u{1F31F}' + Math.floor(sum * 9999 / (numberOfBoids * 128))
  }
  else {
    living.removeAttribute('face')
    living.removeAttribute('status')
    living.textContent = ''
    health.textContent = ''
  }
}

const within = (lower: number, higher: number) => (value: number) => lower <= value && value <= higher

window.addEventListener('DOMContentLoaded', domContentLoaded)
