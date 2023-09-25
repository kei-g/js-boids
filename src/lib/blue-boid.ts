import { Boid } from './boid'
import { BoidLike, CanvasAttribute, Vector2DLike, isBoidLike } from '..'

export class BlueBoid extends Boid {
  constructor(boid: Readonly<BoidLike<Vector2DLike>>)
  constructor(attr: Readonly<CanvasAttribute>)
  constructor(value: Readonly<BoidLike<Vector2DLike>> | Readonly<CanvasAttribute>) {
    isBoidLike(value) ? super(value) : super(value)
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
