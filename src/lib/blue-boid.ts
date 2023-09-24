import { Boid } from './boid'

export class BlueBoid extends Boid {
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
