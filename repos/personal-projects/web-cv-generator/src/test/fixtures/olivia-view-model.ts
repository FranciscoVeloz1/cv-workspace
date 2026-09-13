import type { CvViewModel } from '../../types/cvViewModel'

export const oliviaViewModel: CvViewModel = {
  fullName: 'Olivia Sanchez',
  headline: 'Administrative Manager',
  contactLine: 'hello@reallygreatsite.com | 123-456-7890 | 123 Anywhere St, Any City',
  summary:
    'Detail-oriented administrative professional with over three years of experience providing comprehensive support to executive teams and office operations.',
  experience: [
    {
      heading: 'Administrative Assistant, Arowwai Industries',
      dates: 'Oct 2023 - Present',
      bullets: [
        'Managed executive calendars, schedule meetings, and coordinate travel arrangements.'
      ]
    },
    {
      heading: 'Office Coordinator, Borcelle',
      dates: 'Jan 2022 - Sept 2023',
      bullets: ['Provided administrative support to a team of 20+ employees.']
    }
  ],
  education: [
    {
      heading: 'Bachelor of Business Administration',
      institution: 'University of Business Excellence',
      dates: 'Jan 2019 - Feb 2021'
    }
  ],
  skillNames: [
    'Client Acquisition',
    'B2B Sales',
    'Negotiation',
    'Negotiation Skills',
    'Problem-Solving',
    'Time Management',
    'Relationship Management',
    'Market Analysis'
  ]
}
