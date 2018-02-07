# geop
Simple ol3 tool for Estonian geocache game

require, bootstrap, ol3 map

### To build openlayers node, npm, grunt, pip must be installed

    $ cd
    $ mkdir repos
    $ cd repos
    $ git clone <openlayers_github>
    $ cd ol3
    $ git checkout <version_tag>
    $ make check-deps
    $ npm install

Copy vendor/ol/ol-custom.json to ol3/build/

    $ node tasks/build.js build/ol-custom.json build/ol-custom.js

Copy build/ol-custom.js to src/js/lib/

### To build app:

    $ node tools/r.js -o tools/build.js

### Deploy to prod:

Make sure all changes are commited and app builded.

    $ ./tools/deploy.sh
