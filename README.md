# geop

Simple ol3 tool for Estonian geocache game

https://gp.sookoll.ee

## Development

### Dev.env Requirements

* Node and npm
* Python 3.7 (only for start:prod to test production build)

### To build app for debug:

    npm run build

### To build app for production

    npm run build:prod

### To run dev.server

    npm start

### To test production build

    npm run start:prod

### Deploy to prod:

Make sure all changes are commited in current branch.
Usually you want to merge all development branches (done) to master before deploy.

    $ ./tools/deploy.sh

It will build:prod app and commit dist folder to gh-pages branch and push to github.
