import { AvoidanceDeceleration, BlueBoid, BoidRelationship, CanvasAttribute, Circle, FarAcceleration, SpreadAcceleration, Vector2D } from '..'

export class Boid {
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

  constructor(attr: Readonly<CanvasAttribute>) {
    do {
      const x = 20 + Math.random() * (attr.width - 40)
      const y = 20 + Math.random() * (attr.height - 40)
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

const areAnyoneSuffocating = (boids: Iterable<Boid>): boolean => [...boids].some((boid: Boid) => boid.isSuffocating)

const clamp = (value: number, lower: number, upper: number, alternate: number) => isNaN(value) ? alternate : Math.max(lower, Math.min(value, upper))

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
