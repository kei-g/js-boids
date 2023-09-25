import { Vector2DLike, isVector2DLike } from '..'

export type BoidLike<T extends Vector2DLike> = {
  degrees: {
    suffocation: number
  }
  name: string
  position: T
  velocity: T
}

const hasSuffocation = (value: unknown): value is { suffocation: number } => {
  const d = value as { suffocation: number }
  return typeof d === 'object' && typeof d.suffocation === 'number'
}

export const isBoidLike = <T extends Vector2DLike>(value: unknown): value is BoidLike<T> | Readonly<BoidLike<T>> => {
  const b = value as BoidLike<T>
  return typeof value === 'object' && hasSuffocation(b.degrees) && isVector2DLike(b.position) && isVector2DLike(b.velocity)
}
