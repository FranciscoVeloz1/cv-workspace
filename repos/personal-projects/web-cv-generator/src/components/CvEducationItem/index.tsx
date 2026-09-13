import styles from './CvEducationItem.module.css'

type CvEducationItemProps = {
  heading: string
  institution: string
  dates: string
}

export function CvEducationItem({ heading, institution, dates }: CvEducationItemProps) {
  return (
    <div className={styles.item}>
      <div className={styles.row}>
        <h3 className={styles.heading}>{heading}</h3>
        <p className={styles.dates}>{dates}</p>
      </div>
      <p className={styles.institution}>{institution}</p>
    </div>
  )
}
