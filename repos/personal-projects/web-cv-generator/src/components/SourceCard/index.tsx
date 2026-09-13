import { Link } from 'react-router-dom'
import styles from './SourceCard.module.css'

type SourceCardProps = {
  slug: string
  title: string
  subtitle: string
}

export function SourceCard({ slug, title, subtitle }: SourceCardProps) {
  return (
    <li>
      <Link
        className={styles.card}
        to={{ pathname: '/', search: `?resume=${slug}` }}
        aria-label={title}
      >
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </Link>
    </li>
  )
}
