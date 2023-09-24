import { Boid, Circle, Vector2D } from './lib'

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

window.addEventListener('DOMContentLoaded', domContentLoaded)
