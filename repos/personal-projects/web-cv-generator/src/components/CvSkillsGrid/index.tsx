import styles from './CvSkillsGrid.module.css'

type CvSkillsGridProps = {
  names: string[]
}

export function CvSkillsGrid({ names }: CvSkillsGridProps) {
  return (
    <ul className={styles.list}>
      {names.map((name, index) => {
        return <li key={`${name}-${index}`}>{name}</li>
      })}
    </ul>
  )
}
