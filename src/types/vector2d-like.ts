export type Vector2DLike = {
  x: number
  y: number
}

export const isVector2DLike = (value: unknown): value is Readonly<Vector2DLike> | Vector2DLike => {
  const v = value as Vector2DLike
  return typeof value === 'object' && typeof v.x === 'number' && typeof v.y === 'number'
}
