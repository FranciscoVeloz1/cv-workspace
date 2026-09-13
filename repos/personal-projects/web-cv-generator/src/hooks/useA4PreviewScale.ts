import { useEffect, useState, type RefObject } from 'react'
import { A4_HEIGHT_PX, A4_WIDTH_PX, computeA4Scale } from '../utils/a4Scale'

export type A4PreviewLayout = {
  scale: number
  naturalHeight: number
}

export function useA4PreviewScale(
  stageRef: RefObject<HTMLDivElement | null>,
  sheetRef: RefObject<HTMLDivElement | null>
): A4PreviewLayout {
  const [layout, setLayout] = useState<A4PreviewLayout>({
    scale: 1,
    naturalHeight: A4_HEIGHT_PX
  })

  useEffect(() => {
    const stage = stageRef.current
    const sheet = sheetRef.current
    if (stage === null || sheet === null) {
      return
    }

    const measure = () => {
      const scale = computeA4Scale(
        { width: stage.clientWidth, height: stage.clientHeight },
        { width: A4_WIDTH_PX, height: A4_HEIGHT_PX }
      )
      setLayout({
        scale,
        naturalHeight: Math.max(sheet.scrollHeight, A4_HEIGHT_PX)
      })
    }

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(stage)
    observer.observe(sheet)
    return () => {
      observer.disconnect()
    }
  }, [stageRef, sheetRef])

  return layout
}
