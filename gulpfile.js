// load modules
var gulp = require('gulp');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');
var mocha = require('gulp-mocha');
var jscs = require('gulp-jscs');
var sass = require('gulp-sass');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var express = require('express');
var refresh = require('gulp-livereload');  
var tinylr  = require('tiny-lr');
var lrserver = tinylr();
// paths
var pathToJs = './source/js/';
var jsEntryPoint = pathToJs + 'main.js';
var buildPath = './';
var jsPath = [jsEntryPoint, pathToJs + 'source/*/*.js'];
var cssPath = './';
var sassPath = './source/scss/*/*.scss';
var testPath = './test/test.js';

// settings
var ingnoreLint = false;
var ingnoreTests = true;
var runBrowserTest = true;

// express
gulp.task('express', function() {
  var app = express()
    .use(express.static(__dirname))
    .listen(3000);
  refresh.listen();
});

// livereload
gulp.task('lr-server', function() {  
  lrserver.listen(3001, function(err) {
    if (err) {
      return console.log(err);
    }
  });
})

// clean screen
gulp.task('clean-screen', function() {
  process.stdout.write('\033c');
})

// linter
gulp.task('lint', function() {
  if (!ingnoreLint) {
    return gulp.src(jsPath).pipe(jscs());
  }
});

// test runner
gulp.task('test', function() {
  if (!ingnoreTests) {
    if (runBrowserTest) {
      return gulp
        .src('./test/test.html')
        .pipe(mochaPhantomJS())
        .on('error', function(err) {
          console.log(err)
        });
    } else {
      return gulp.src(testPath, {read: false})
        .pipe(mocha())
        .on('error', function(err) {
          console.log(err)
        });
    }
  }
});

// build js files into single bundle
gulp.task('build-js', function() {
  var bundler = watchify(browserify(jsEntryPoint, watchify.args));
  var bundle = function() {
    return bundler.bundle()
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('editor.js'))
      // optional, remove if you dont want sourcemaps
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        .pipe(sourcemaps.write('./')) // writes .map file
      //
      .pipe(gulp.dest(buildPath))
      
  }
  bundler.on('update', bundle); // on any dep update, runs the bundler
  bundler.on('log', gutil.log); // output build logs to terminal
  return bundle();
}); 

// sass compiler
gulp.task('sass', function() {
  return gulp.src(sassPath)
    .pipe(sass())
    .pipe(gulp.dest(cssPath))
});

// task runner
gulp.task('default', function() {  
  gulp.run('clean-screen', 'lr-server', 'express', 'sass', 'build-js');

  gulp.watch(jsPath, ['clean-screen', 'lint', 'test', 'build-js']);
  gulp.watch(testPath, ['clean-screen', 'lint', 'test']);
  gulp.watch(sassPath, ['clean-screen', 'sass']);
  
  gulp.watch(['*.*', './test/*.js'], function(event) {  
    return gulp.src(event.path).pipe(refresh(lrserver));
  });
});
