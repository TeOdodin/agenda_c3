'use strict';

/* eslint-env node */
/*
 * Lancement dans un terminal dédié (laisser le tourner indéfiniment) :
 * node_modules/.bin/gulp
 *
 * la tâche 'lint' vérifie la syntaxe des fichiers js au lancement et à chaque
 * modification d'un fichier.
 *
 */

var gulp = require('gulp'),
    cache = require('gulp-cached'),
    gutil = require('gulp-util'),
    map = require('map-stream'),
    eslint = require('gulp-eslint'),
    cssvalidate = require('gulp-w3c-css'),
    htmlvalidate = require('gulp-html-validator'),
    bs = require('browser-sync').create(),
    watch = require('gulp-watch');

var inputPaths = {
    JavaScript: ['./application/js/*.js', './application/js/**/*.js', '!./application/js/librairies/**/*.js', './api/*.js', './api/**/*.js', '!./api/*min*.js'],
    Css: './application/css/*.css',
    Html: ['./application/*.html', './application/**/*.html'],
};

gulp.task('lint', function () {
    return gulp
        .src(inputPaths.JavaScript)
        .pipe(cache('lint'))
        .pipe(eslint({
            'extends': 'eslint:recommended',
            'envs': [
                'node',
            ],
            parserOptions: {   // https://eslint.org/docs/user-guide/configuring
              ecmaVersion: 11,
              // ecmaFeatures: {impliedStrict: true,},
            },
            // documentation des règles eslint :
            // http://eslint.org/docs/rules
            'rules': {
                'no-warning-comments': ['warn', {terms: ['todo', 'fixme', 'xxx'], location: 'anywhere'}],

                'no-console': 'off',

                'strict': ['error', 'global'],

                'indent': ['error', 4, {'SwitchCase': 1}],

                'brace-style': ['error', 'stroustrup'],

                'semi': ['error', 'always'],
                'no-extra-semi': 'error',
                'semi-spacing': ['error', {'before': false, 'after': true}],

                'keyword-spacing': ['error', {'before': true, 'after': true}],

                'no-trailing-spaces': 'error',

                'no-lonely-if': 'error',
                'key-spacing': 'error',
                'comma-spacing': 'error',
                'comma-dangle': ['error', 'always-multiline'],
                'space-infix-ops': ['error', {'int32Hint': true}],
                'array-bracket-spacing': ['error', 'never'],
                'object-curly-spacing': 'error',
                'space-before-function-paren': ['error', {'anonymous': 'always', 'named': 'never'}],
                'wrap-iife': ['error', 'outside'],
                'no-implied-eval': 'error',
                'quotes': ['error', 'single', {'avoidEscape': true}],

                'vars-on-top': 'error',
                /*'no-undef': 'error',*/
                'no-unused-vars': 'error',

                'eqeqeq': 'error',
                'no-plusplus': 'error',
                'no-constant-condition': ['error', {'checkLoops': false}],
                'no-eval': 'error',
                'no-extra-bind': 'error',
            },
        }))
        .pipe(eslint.format());
});

gulp.task('validatecss', function () {
    bs.reload();
    gulp.src(inputPaths.Css)
    .pipe(cssvalidate())
      .pipe(map(function (file, done) {
          console.log('============== CSS ==================');
          if (file.contents.length === 0) {
              console.log('Success: ' + file.path);
              console.log(gutil.colors.green('No errors or warnings\n'));
          }
          else {
              const results = JSON.parse(file.contents.toString());
              results.errors.forEach(function (error) {
                  console.log('Error: ' + file.path + ': line ' + error.line);
                  console.log(gutil.colors.red(error.message) + '\n');
              });
              results.warnings.forEach(function (warning) {
                  console.log('Warning: ' + file.path + ': line ' + warning.line);
                  console.log(gutil.colors.yellow(warning.message) + '\n');
              });
              console.log(results.errors.length + ' error - ' + results.warnings.length + ' warnings\n');
          }
          done(null, file);
      }));
});

gulp.task('validatehtml', function () {
    bs.reload();
    gulp.src(inputPaths.Html)
    .pipe(htmlvalidate())
    .pipe(map(function (file, done) {
        console.log('============== HTML ==================');
        const results = JSON.parse(file.contents.toString());
        if (results.messages.length === 0) {
            console.log('Success: ' + file.path);
            console.log(gutil.colors.green('No errors or warnings\n'));
        }
        else {
            let nbErrors = 0;
            let nbWarnings = 0;
            results.messages.forEach(function (message) {
                if (!message.lastLine) {
                    message.lastLine = 'non spécifiée';
                }
                console.log(message.type + ': ' + file.path + ': line ' + message.lastLine);
                if (message.type === 'error') {
                    nbErrors += 1;
                    console.log(gutil.colors.red(message.message) + '\n');
                }
                else if (message.type === 'warning') {
                    nbWarnings += 1;
                    console.log(gutil.colors.orange(message.message) + '\n');
                }
                else {
                    console.log(message.message + '\n');
                }
            });
            console.log(nbErrors + ' error - ' + nbWarnings + ' warnings\n');
        }
        done(null, file);
    }));
});

gulp.task('browser-sync', function () {
    bs.init({
        server: {
            baseDir: './',
        },
        files: ['*.css', 'js/*.js', '*.html'],
        port: 3002,
    });
});

gulp.src(inputPaths.JavaScript)
    .pipe(watch(inputPaths.JavaScript, {usePolling: true}, function () {
        gulp.series('lint');
    }));

gulp.src(inputPaths.Css)
    .pipe(watch(inputPaths.Css, {usePolling: true}, function () {
        gulp.series('validatecss');
    }));

gulp.src(inputPaths.Html)
    .pipe(watch(inputPaths.Html, {usePolling: true}, function () {
        gulp.series('validatehtml');
    }));

gulp.task('validate', gulp.series('validatecss', 'validatecss'));

gulp.task('default', gulp.series('lint', 'validate', 'browser-sync'));

// vim:set et sw=4:
