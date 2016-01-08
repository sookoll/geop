/*jslint browser: true, regexp: true, nomen: true, plusplus: true, continue: true */
/*global requirejs*/

requirejs.config({
    "urlArgs": "bust=" + (new Date()).getTime(),
    "waitSeconds": 60,
    "baseUrl" : "js",
    "paths" : {
        "text" : "lib/text",
        "templator" : "lib/handlebars-v3.0.3",
        "jquery" : "lib/jquery-2.1.3.min",
        "jquery.bootstrap" : "lib/bootstrap.min",
        "jquery.sortable" : "lib/jquery.fn.sortable",
        "d3" : "lib/d3.min",
        "ol" : "lib/ol",
        "config" : "../config",
        "app": "app",
        "tmpl": "../tmpl"
    },
    "shim": {
        "jquery.bootstrap": {
            deps: ['jquery']
        },
        "jquery.sortable": {
            deps: ['jquery']
        }
    }
});

// Load the main app module to start the app
requirejs(['app/main']);
