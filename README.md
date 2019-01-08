# geop

Simple ol tool for Estonian geocache game

https://gp.sookoll.ee

## Development

### Dev.env Requirements

* Node and npm
* Python 3.7

### To build app for debug:
```
npm run build
```
### To rebuild translations
```
npm run build:translations
```
### To build app for production
```
npm run build:prod
```
### To run dev.server
```
npm start
```
### To run dev.server with HTTPS
```
npm run start:ssl
```
### To test production build
```
npm run start:prod
```
### Deploy to prod:

Make sure all changes are commited in current branch.
Usually you want to merge all development branches (done) to master before deploy.
```
npm run deploy
```
It will build:prod app and commit dist folder to gh-pages branch and push to github.

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
