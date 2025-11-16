// Third-party Imports
import 'server-only'

const dictionaries = {
  en: () => import('@/data/dictionaries/en.json').then(module => module.default),
  fr: () => import('@/data/dictionaries/fr.json').then(module => module.default),
  ar: () => import('@/data/dictionaries/ar.json').then(module => module.default)
}

export const getDictionary = async locale => {
  // Fallback to 'en' if locale is not supported
  const dictionary = dictionaries[locale] || dictionaries['en']
  return dictionary()
}
