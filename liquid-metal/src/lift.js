// Softens the metal's near-black shadows, which the shader's tint can't lighten.
// 0 = off, 1 = strongest. Applied as a CSS filter, so exports match the preview.
export const liftFilter = (lift = 0) =>
  lift > 0 ? `contrast(${(1 - 0.35 * lift).toFixed(3)}) brightness(${(1 + 0.18 * lift).toFixed(3)})` : 'none'
