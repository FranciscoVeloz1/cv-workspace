import styles from './CvHeader.module.css'

type CvHeaderProps = {
  fullName: string
  headline: string | null
  contactLine: string | null
}

export function CvHeader({ fullName, headline, contactLine }: CvHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.name}>{fullName}</h1>
      {headline !== null ? <p className={styles.headline}>{headline}</p> : null}
      <hr className={styles.rule} />
      {contactLine !== null ? <p className={styles.contact}>{contactLine}</p> : null}
    </header>
  )
}
