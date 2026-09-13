import { z } from 'zod'

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const catalogSchema = z
  .object({
    resumes: z.array(
      z.object({
        slug: slugSchema,
        title: z.string().trim().min(1),
        subtitle: z.string().trim().min(1)
      })
    )
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()
    data.resumes.forEach((entry, index) => {
      if (seen.has(entry.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate slug',
          path: ['resumes', index, 'slug']
        })
      }
      seen.add(entry.slug)
    })
  })

export type Catalog = z.infer<typeof catalogSchema>
