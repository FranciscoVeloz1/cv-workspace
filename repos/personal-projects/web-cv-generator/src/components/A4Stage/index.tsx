import { useRef, type ReactNode } from 'react'
import { useA4PreviewScale } from '../../hooks/useA4PreviewScale'
import styles from './A4Stage.module.css'

type A4StageProps = {
  children: ReactNode
}

export function A4Stage({ children }: A4StageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const layout = useA4PreviewScale(stageRef, sheetRef)

  return (
    <div className={`preview-stage ${styles.stage}`} ref={stageRef}>
      <div
        className={`preview-scale ${styles.scale}`}
        style={{
          transform: `scale(${layout.scale})`,
          transformOrigin: 'top center',
          marginBottom: `${(layout.scale - 1) * layout.naturalHeight}px`
        }}
      >
        <div ref={sheetRef}>{children}</div>
      </div>
    </div>
  )
}
