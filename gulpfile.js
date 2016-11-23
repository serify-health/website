'use strict';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const del = require('del');

var tsProject = ts.createProject('tsconfig.json', {
    typescript: require('typescript')
    //outFile: './content/app.js'
});

gulp.task('clean', function () {
  return del('dist/**/*');
});

gulp.task('tscompile', function () {
    var tsResult = gulp.src('./content-src/**/*.ts').pipe(tsProject());
    return tsResult.js.pipe(gulp.dest('./content/dist'));
});

gulp.task('app-bundle', () => {
    var tsResult = gulp.src('./content-src/**/*.ts').pipe(tsProject());
    return tsResult.js.pipe(concat('./content/app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./content/dist'));
});
//http://blog.scottlogic.com/2015/12/24/creating-an-angular-2-build.html
gulp.task('vendor-bundle', function() {
    gulp.src([
	    'node_modules/es6-shim/es6-shim.min.js',
	    'node_modules/systemjs/dist/system-polyfills.js',
	    'node_modules/angular2/bundles/angular2-polyfills.js',
	    'node_modules/systemjs/dist/system.src.js',
	    'node_modules/rxjs/bundles/Rx.js',
	    'node_modules/angular2/bundles/angular2.dev.js',
	    'node_modules/angular2/bundles/http.dev.js',
	    'node_modules/@angular/core/bundles/core.umd.js',
      	'node_modules/@angular/common/bundles/common.umd.js',
      	'node_modules/@angular/compiler/bundles/compiler.umd.js',
      	'node_modules/@angular/platform-browser/bundles/platform-browser.umd.js',
      	'node_modules/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      	'node_modules/@angular/http/bundles/http.umd.js',
      	'node_modules/@angular/router/bundles/router.umd.js',
      	'node_modules/@angular/router/bundles/router-upgrade.umd.js',
      	'node_modules/@angular/forms/bundles/forms.umd.js',
      	'node_modules/@angular/upgrade/bundles/upgrade.umd.js',
      	'node_modules/@angular/upgrade/bundles/upgrade-static.umd.js',
      	'node_modules/rxjs/bundles/Rx.min.js'
    ])
    .pipe(concat('vendors.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./content/dist'));
});

gulp.task('boot-bundle', function() {
    gulp.src('./content-src/boot.prod.js')
    .pipe(concat('boot.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./content/dist'));
});

gulp.task('default', ['app-bundle', 'vendor-bundle', 'boot-bundle']);