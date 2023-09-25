export type CanvasAttribute = {
  height: number
  width: number
}

export const isCanvasAttribute = (value: unknown): value is CanvasAttribute | Readonly<CanvasAttribute> => {
  const attr = value as CanvasAttribute
  return typeof value === 'object' && typeof attr.height === 'number' && typeof attr.width === 'number'
}
