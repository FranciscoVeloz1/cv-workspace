import styles from './CvExperienceItem.module.css'

type CvExperienceItemProps = {
  heading: string
  dates: string
  bullets: string[]
}

export function CvExperienceItem({ heading, dates, bullets }: CvExperienceItemProps) {
  return (
    <div className={styles.item}>
      <div className={styles.row}>
        <h3 className={styles.heading}>{heading}</h3>
        <p className={styles.dates}>{dates}</p>
      </div>
      {bullets.length > 0 ? (
        <ul className={styles.bullets}>
          {bullets.map((bullet, index) => {
            return <li key={`${bullet}-${index}`}>{bullet}</li>
          })}
        </ul>
      ) : null}
    </div>
  )
}
