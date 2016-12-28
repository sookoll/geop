({
    mainConfigFile: '../www/src/js/app.js',
    appDir: "../www/src",
    dir: "../www/dist",
    baseUrl: "js",
    modules: [
        {
            name: "app/main"
        }
    ],
    optimize: "uglify2",
    optimizeCss: "standard",
    removeCombined: true
})