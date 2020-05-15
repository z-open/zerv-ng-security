// ////////////////////////////////////////////
// Modules
// ////////////////////////////////////////////

// the main gulp reference
const gulp = require('gulp');

const babel = require('gulp-babel');

// combines files into a single destination file (https://github.com/wearefractal/gulp-concat)
const concat = require('gulp-concat');

// angular.js annotation for compression (https://www.npmjs.com/package/gulp-ng-annotate)
const annotate = require('gulp-ng-annotate');

// add an IIFE to each file () 
const iife = require('gulp-iife');

// ////////////////////////////////////////////
// Variables
// ////////////////////////////////////////////

// All application JS files.
const appFiles = [
    'src/**/*.js'
];

// ////////////////////////////////////////////
// Tasks
// ////////////////////////////////////////////

// wrap all angular code in bracket and add useStrict, and add sourcemap in dev
gulp.task('build', () => {
    return gulp.src(appFiles)
        .pipe(iife({
            useStrict: false,
            trimCode: true,
            prependSemicolon: false,
            bindThis: false,
        }))
        .pipe(babel({
            presets: ['env'],
        }))
        .pipe(concat('zerv-ng-security.js'))
        .pipe(annotate())
        .pipe(gulp.dest('dist/'));
});

