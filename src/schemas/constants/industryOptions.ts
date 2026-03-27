// Industry tipleri - Site tab filtreleme ve admin form icin
export const INDUSTRIES = [
  { label: 'Tümü', value: 'all' }, // Site filtreleme icin
  { label: 'Fintech', value: 'Fintech' },
  { label: 'E-commerce', value: 'E-commerce' },
  { label: 'Agency', value: 'Agency' },
  { label: 'Media', value: 'Media' },
  { label: 'Freelancer', value: 'Freelancer' },
] as const

// Form secenekleri (Tümü haric)
export const INDUSTRY_OPTIONS = INDUSTRIES.filter(i => i.value !== 'all')

// Type export
export type IndustryValue = (typeof INDUSTRIES)[number]['value']
export type IndustryOption = (typeof INDUSTRIES)[number]
