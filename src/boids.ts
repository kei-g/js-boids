import { Boid, Circle, Vector2D } from './lib'

const addOrRemoveCircle = (event: MouseEvent): void => {
  const c = event.target as unknown as HTMLCanvasElement
  const r = c.getBoundingClientRect()
  const p = new Vector2D(
    (event.x - r.left) * c.width / r.width,
    (event.y - r.top) * c.height / r.height
  )
  const found = Boid.circles.filter(p.collisionDetector)
  for (const circle of found) {
    const index = Boid.circles.indexOf(circle)
    Boid.circles.splice(index, 1)
  }
  if (found.length === 0)
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
