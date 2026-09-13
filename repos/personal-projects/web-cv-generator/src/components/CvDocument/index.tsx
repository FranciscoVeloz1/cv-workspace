import type { CvViewModel } from '../../types/cvViewModel'
import { CvEducationItem } from '../CvEducationItem'
import { CvExperienceItem } from '../CvExperienceItem'
import { CvHeader } from '../CvHeader'
import { CvSection } from '../CvSection'
import { CvSkillsGrid } from '../CvSkillsGrid'
import styles from './CvDocument.module.css'

type CvDocumentProps = {
  cv: CvViewModel
}

export function CvDocument({ cv }: CvDocumentProps) {
  return (
    <article className={styles.sheet} aria-label='Curriculum vitae'>
      <div className={`${styles.page} cv-page`}>
        <CvHeader fullName={cv.fullName} headline={cv.headline} contactLine={cv.contactLine} />
        {cv.summary !== null ? (
          <CvSection title='Summary'>
            <p className={styles.summary}>{cv.summary}</p>
          </CvSection>
        ) : null}
        {cv.experience.length > 0 ? (
          <CvSection title='Work Experience'>
            {cv.experience.map((item, index) => {
              return (
                <CvExperienceItem
                  key={`${item.heading}-${item.dates}-${index}`}
                  heading={item.heading}
                  dates={item.dates}
                  bullets={item.bullets}
                />
              )
            })}
          </CvSection>
        ) : null}
        {cv.education.length > 0 ? (
          <CvSection title='Education'>
            {cv.education.map((item, index) => {
              return (
                <CvEducationItem
                  key={`${item.heading}-${item.dates}-${index}`}
                  heading={item.heading}
                  institution={item.institution}
                  dates={item.dates}
                />
              )
            })}
          </CvSection>
        ) : null}
        {cv.skillNames.length > 0 ? (
          <CvSection title='Key Skills'>
            <CvSkillsGrid names={cv.skillNames} />
          </CvSection>
        ) : null}
      </div>
    </article>
  )
}
