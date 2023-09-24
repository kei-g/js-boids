type CollisionDetector = (circle: Circle) => boolean

class Vector2D implements Vector2DLike {
  x: number
  y: number

  constructor(x: number, y: number)
  constructor(v: Vector2DLike)
  constructor(x: number | Vector2DLike, y?: number) {
    if (typeof (x) === 'number') {
      this.x = x
      this.y = y
    }
    else {
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
  protected count: number

  constructor() {
    super(0, 0)
    this.count = 0
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
  static readonly all = [] as Boid[]
  static readonly circles = [] as Circle[]

  readonly #session: WeakRef<Session>

  private readonly backup = new Vector2D(0, 0)
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  readonly degrees = {
    suffocation: 0,
  }
  readonly position: Vector2D
  readonly velocity: Vector2D

  constructor(session: Session) {
    this.#session = new WeakRef(session)
    this.canvas = session.canvas
    this.context = session.context
    do {
      const x = 20 + Math.random() * (session.canvas.width - 40)
      const y = 20 + Math.random() * (session.canvas.height - 40)
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

  draw(): void {
    this.context.beginPath()
    this.context.fillStyle = `rgb(${this.color})`
    this.context.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2, true)
    this.context.fill()
    this.context.closePath()
  }

  get isSuffocating(): boolean {
    return 0 < this.degrees.suffocation
  }

  move(): void {
    this.nextPoint.copyTo(this.position)
    this.avoidCircles()
    this.turnOverByEdgeOfCanvas()
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

  get session(): Session {
    return this.#session.deref()
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
    this.velocity.copyTo(this.backup)
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

  private updateSuffocation(): void {
    this.degrees.suffocation += [-0.125, 1][+Boid.circles.some((circle: Circle) => circle.doesCollide(this.position))]
    this.degrees.suffocation = Math.max(0, this.degrees.suffocation)
  }
}

class BlueBoid extends Boid {
  constructor(session: Session) {
    super(session)
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

type Session = {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  intervalId: NodeJS.Timeout
  numberOfBoids: number
  regenerate: (session: Session) => Session
}

const addOrRemoveCircle = (context: CanvasRenderingContext2D, event: MouseEvent): void => {
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
    Boid.circles.push(new Circle(context, p.x, p.y))
}

const areAnyoneSuffocating = (boids: Iterable<Boid>): boolean => [...boids].some((boid: Boid) => boid.isSuffocating)

const clamp = (value: number, lower: number, upper: number, alternate: number) => isNaN(value) ? alternate : Math.max(lower, Math.min(value, upper))

const createSession = (): Session => {
  Boid.all.splice(0)
  const canvas = document.getElementById('boids') as HTMLCanvasElement
  const context = canvas.getContext('2d')
  const update = () => updateBoids(canvas, context)
  const nob = document.getElementById('number-of-boids') as HTMLInputElement
  const mnb = document.getElementById('max-number-of-boids') as HTMLInputElement
  const numberOfBoids = clamp(parseInt(nob.value), 1, parseInt(mnb.value), 100)
  const session = {
    canvas,
    context,
    numberOfBoids,
  } as Session
  nob.value = numberOfBoids.toString()
  for (let i = 0; i < numberOfBoids; i++) {
    const r = Math.floor(Math.random() * 2)
    const ctor = [Boid, BlueBoid][r]
    Boid.all.push(new ctor(session))
  }
  session.intervalId = setInterval(update, 25)
  session.regenerate = (s: Session) => (clearInterval(s.intervalId), createSession())
  return session
}

const domContentLoaded = () => {
  const applySize = (): void => (canvas.height = canvas.clientHeight, canvas.width = canvas.clientWidth, undefined)
  const canvas = document.getElementById('boids') as HTMLCanvasElement
  window.addEventListener('resize', applySize)
  applySize()
  canvas.onmouseup = event => addOrRemoveCircle(context, event)
  const context = canvas.getContext('2d')
  const ctx = { session: createSession() }
  const regenerate = (): void => (ctx.session = ctx.session.regenerate(ctx.session), undefined)
  const resetButton = document.getElementById('reset-button')
  resetButton.addEventListener('click', regenerate)
}

const findSession = () => {
  for (const boid of Boid.all) {
    const { session } = boid
    if (session)
      return session
  }
}

const summarize = <T>(source: Iterable<T>) => (selector: (value: T) => number) => {
  const ctx = { count: 0, sum: 0 }
  for (const value of source)
    ctx.sum += selector(value)
  return ctx
}

const updateBoids = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  context.globalCompositeOperation = 'source-over'
  context.fillStyle = 'rgba(0, 0, 0, .1)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  Boid.circles.forEach((circle: Circle) => circle.draw())
  context.globalCompositeOperation = 'lighter'
  const alive = new Set<Boid>()
  for (const boid of Boid.all) {
    boid.draw()
    boid.update()
    if (boid.degrees.suffocation < 128)
      alive.add(boid)
  }
  const living = document.getElementById('number-of-living-boids') as HTMLSpanElement
  const health = document.getElementById('health-of-living-boids') as HTMLSpanElement
  const session = findSession()
  if (session) {
    const num = session.numberOfBoids
    const statusIndex = Math.floor(alive.size * 3 / num)
    const status = ['bad', 'not-good', 'good', 'perfect'][statusIndex]
    living.setAttribute('face', [status, 'warn'][+(1 < statusIndex && areAnyoneSuffocating(alive))])
    living.setAttribute('status', status)
    living.textContent = alive.size.toString()
    const { sum } = summarize(alive)((boid: Boid) => 128 - boid.degrees.suffocation)
    health.textContent = '\u{1F31F}' + Math.floor(sum * 9999 / (num * 128))
  }
  else {
    living.removeAttribute('face')
    living.removeAttribute('status')
    living.textContent = ''
    health.textContent = ''
  }
  Boid.all.splice(0)
  Boid.all.push(...alive)
  for (const boid of Boid.all) {
    boid.normalize()
    boid.move()
  }
}

const within = (lower: number, higher: number) => (value: number) => lower <= value && value <= higher

window.addEventListener('DOMContentLoaded', domContentLoaded)
