export function computeA4Scale(
  stage: { width: number; height: number },
  sheet: { width: number; height: number }
): number {
  const pad = 32
  const availableW = Math.max(stage.width - pad, 1)
  const availableH = Math.max(stage.height - pad, 1)
  const raw = Math.min(availableW / sheet.width, availableH / sheet.height, 1)
  return Math.max(raw, 0.25)
}

export const A4_WIDTH_PX = (210 * 96) / 25.4
export const A4_HEIGHT_PX = (297 * 96) / 25.4
