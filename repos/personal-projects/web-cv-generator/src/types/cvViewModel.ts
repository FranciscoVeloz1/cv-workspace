export type CvExperienceItem = {
  heading: string
  dates: string
  bullets: string[]
}

export type CvEducationItem = {
  heading: string
  institution: string
  dates: string
}

export type CvViewModel = {
  fullName: string
  headline: string | null
  contactLine: string | null
  summary: string | null
  experience: CvExperienceItem[]
  education: CvEducationItem[]
  skillNames: string[]
}
