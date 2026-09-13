import { z } from 'zod'

const workExperienceSchema = z
  .object({
    position: z.string(),
    company: z.string(),
    employmentType: z.string(),
    startDate: z.string(),
    endDate: z.union([z.string(), z.null()]),
    duration: z.string(),
    location: z.string(),
    logo: z.string(),
    responsibilities: z.array(z.string()),
    skills: z.array(z.number())
  })
  .passthrough()

const educationSchema = z
  .object({
    degree: z.string(),
    institution: z.string(),
    duration: z.string(),
    location: z.string(),
    logo: z.string()
  })
  .passthrough()

const skillSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    category: z.string()
  })
  .passthrough()

export const resumeSchema = z
  .object({
    profile: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        fullName: z.string().trim().min(1),
        headline: z.string(),
        email: z.string(),
        phone: z.string(),
        location: z.string(),
        website: z.string(),
        profilePhoto: z.string()
      })
      .passthrough(),
    summary: z
      .object({
        short: z.string(),
        long: z.string(),
        highlights: z.array(z.string()).optional()
      })
      .passthrough(),
    workExperience: z.array(workExperienceSchema),
    education: z.array(educationSchema),
    skills: z.array(skillSchema),
    projects: z.array(z.unknown()),
    certifications: z.array(z.unknown()),
    achievements: z.array(z.unknown()),
    languages: z.array(z.unknown()),
    socialNetworks: z.array(z.unknown())
  })
  .passthrough()

export type Resume = z.infer<typeof resumeSchema>
