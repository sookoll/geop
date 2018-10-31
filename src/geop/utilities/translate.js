const store = {
  locale: null,
  texts: {}
}

export function initLocale (locale, texts) {
  if (locale && locale in texts) {
    store.texts = texts[locale]
  } else {
    store.texts = texts[Object.keys(texts)[0]]
  }
  store.locale = locale
}

export function t (key) {
  return (key in store.texts) ? store.texts[key] : key
}
