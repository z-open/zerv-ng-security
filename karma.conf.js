// Karma configuration
// Generated on Wed Aug 05 2015 15:38:51 GMT-0500 (CDT)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // set browser inactivity to 120 seconds
        browserNoActivityTimeout: 120000,

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
           'node_modules/lodash/lodash.js',
           'node_modules/angular/angular.js',
           'node_modules/angular-mocks/angular-mocks.js',
           'node_modules/@uirouter/angularjs/release/angular-ui-router.js',
           'dist/**/*.js',
           'src/**/*.spec.js'
        ],

        // Test results reporter to use:
        // possible values: 'dots', 'progress', 'verbose', 'coverage'
        reporters: ['dots', 'coverage'],

        preprocessors: {
            'dist/**/*.js': ['coverage']
        },

        coverageReporter: {
            dir: require('path').join(__dirname, '../coverage'),
            type: 'text',
            includeAllSources: true,
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher

        // uncomment this line when debugging unit tests in Chrome:
        // browsers: ['ChromeHeadless', 'Chrome'],
        browsers: ['ChromeHeadless'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    });
};
