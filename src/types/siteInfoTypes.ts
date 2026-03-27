export type siteInfoType = {
  sayHi: string
  title: {
    highlight: string
    rest: string
  }
  description: string
  email: string
  phone: string
  location: string
  experience: string
  cvUrl: string
  socialLinks: socialLinksType[]
}

type socialLinksType = {
  platform: string
  url: string
}
