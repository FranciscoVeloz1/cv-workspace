import type { ReactNode } from 'react'
import styles from './CvSection.module.css'

type CvSectionProps = {
  title: string
  children: ReactNode
}

export function CvSection({ title, children }: CvSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.rail}>{title}</h2>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
