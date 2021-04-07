# geop

Simple ol tool for Estonian geocache game

https://gp.sookoll.ee

## Development

### Dev.env Requirements

* Node and npm
* Python 3.7

### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Lints and fixes files
```
npm run lint
```

### Rebuild translations
```
npm run build:translations
```

### Deploy to prod (Github pages):

Make sure all changes are commited in current branch.
Usually you want to merge all development branches (done) to master before deploy.
```
npm run deploy
```
It will build:prod app and commit dist folder to gh-pages branch and push to github.


### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Layers configuration

**WMTS**
```
{
  type: 'WMTS',
  title: 'Fin',
  url: 'https://mapservices.navici.com/basemaps/gwc/service/wmts?apikey=<your_key>',
  projection: 'EPSG:3067',
  layer: 'rk',
  matrixSet: 'ETRS-TM35FIN',
  matrixSetPrepend: 'ETRS-TM35FIN:',
  matrixSetCount: 16,
  extent: [-2097152, 5242880, 3145728, 9437184],
  maxResolution: 8192,
  format: 'image/png8',
  style: 'default'
}
```
