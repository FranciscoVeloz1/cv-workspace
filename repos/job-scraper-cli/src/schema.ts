import { z } from 'zod';

export const JobSchema = z.object({
  id: z.string().min(1),
  source: z.enum(['himalayas', 'remotive', 'remoteok', 'wwr', 'hn']),
  title: z.string().min(1),
  company: z.string().min(1),
  url: z.string().url(),
  location: z.string(),
  employment: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  salary: z.string().nullable()
});

export type Job = z.infer<typeof JobSchema>;
