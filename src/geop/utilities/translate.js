import {setState} from 'Utilities/store'

const store = {
  locale: null,
  texts: {}
}

export function initLocale (locale, texts) {
  if (locale && locale in texts) {
    store.texts = texts
    store.locale = locale
  }
  setState('app/locale', store.locale, true)
}

export function changeLocale (locale) {
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
