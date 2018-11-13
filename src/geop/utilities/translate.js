import {getState, setState} from 'Utilities/store'

const store = {
  locale: null,
  texts: {}
}

store.locale = getState('locale')

console.log(store)

export function initLocale (locale, texts) {
  if (locale && locale in texts) {
    store.texts = texts
    store.locale = store.locale || locale
  }
  setState('locale', store.locale)
}

export function changeLocale (locale) {
  setState('locale', locale)
  initLocale(locale, store.texts)
}

export function t (key) {
  return (key in store.texts[store.locale]) ? store.texts[store.locale][key] : key
}

export function getLocales () {
  return Object.keys(store.texts)
}

export function getLocale () {
  return store.locale
}
