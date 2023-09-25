import { Boid } from './boid'
import { CanvasAttribute } from '..'

export class BlueBoid extends Boid {
  constructor(attr: Readonly<CanvasAttribute>) {
    super(attr)
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
