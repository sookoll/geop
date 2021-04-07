const package = require('./package.json')

function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

process.env.VUE_APP_VERSION = package.version
process.env.VUE_APP_NAME = capitalize(package.name)
process.env.VUE_APP_DESCRIPTION = package.description

module.exports = {
  devServer: {
    host: 'localhost'
  },
  pwa: {
    name: process.env.VUE_APP_NAME + ' by sookoll',
    display: 'standalone',
    orientation: 'any',
    themeColor: '#6c757d',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestOptions: {
      short_name: process.env.VUE_APP_NAME,
      description: process.env.VUE_APP_DESCRIPTION,
      display: 'standalone',
      orientation: 'any',
      start_url: '.',
      background_color: '#6c757d',
      icons: [
        {
          src: './img/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: './img/icons/android-chrome-256x256.png',
          sizes: '256x256',
          type: 'image/png',
        },
        {
          src: './img/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
        {
          src: './img/icons/mstile-150x150.png',
          sizes: '150x150',
          type: 'image/png',
        },
      ],
    },
    iconPaths: {
      msTileImage: 'img/icons/mstile-150x150.png',
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/apple-touch-icon.png',
      maskIcon: 'img/icons/safari-pinned-tab.svg'
    }
  }
}
