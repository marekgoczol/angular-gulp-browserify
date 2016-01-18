var gulp = require('gulp');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var browserSync = require('browser-sync').create();
var replace = require('gulp-replace');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var rename = require("gulp-rename");
var exec = require('gulp-shell');
var del = require('del');
var runSequence = require('run-sequence');

var bundle = function(bundler) {
    return bundler
        .bundle()
        .on('error', function(e) {
            gutil.log(e);
        })
        .pipe(source('app.js'))
        .pipe(gulp.dest('./public/build'))
        .pipe(browserSync.stream());
};

gulp.task('concatVendors', function() {
    return gulp.src([
        'node_modules/angular/angular.js',
        'node_modules/angular-aria/angular-aria.js', 
        'node_modules/angular-animate/angular-animate.js', 
        'node_modules/angular-material/angular-material.js',
        'node_modules/angular-ui-router/build/angular-ui-router.js', 
    ])
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('./public/build'));
});

gulp.task('watch', function() {
    var watcher = watchify(browserify('./lib/app/index.js', watchify.args));
    bundle(watcher);
    
    watcher.on('update', function() {
        bundle(watcher);
    });
    
    watcher.on('update', gutil.log);
    
    browserSync.init({
       server: './public',
       logFileChanges: true
    });
});

gulp.task('minifyVendors', function() {
    return gulp.src('public/build/vendor.js')
        .pipe(minify())
        .pipe(gulp.dest('public/build'));
});

gulp.task('minifyJS', function() {
    return gulp.src('public/build/app.js')
        .pipe(minify())
        .pipe(gulp.dest('public/build'));
});

gulp.task('bundleApp', function() {
    return bundle(browserify('./lib/app/index.js'));
});

gulp.task('replaceDev', function() {
    gulp.src(['./lib/index.html'])
        .pipe(replace('{{MIN}}', ''))
        .pipe(gulp.dest('./public'));
});

gulp.task('replaceProd', function() {
    gulp.src(['./lib/index.html'])
        .pipe(replace('{{MIN}}', '-min'))
        .pipe(gulp.dest('./public'));
});

gulp.task('buildDev', function() {
    var watcher = watchify(browserify('./lib/app/index.js', watchify.args));
    bundle(watcher);
})

gulp.task('cleanVendors', function() {
    return del([
        'public/build/vendor*'
    ]);
});

gulp.task('cleanApp', function() {
    return del([
        'public/build/app*'
    ]);
});

gulp.task('default', function(cb) {
    runSequence('cleanApp', 'buildDev', 'replaceDev', 'watch');
}); 

gulp.task('postinstall', function(cb) {
    runSequence('concatVendors', 'minifyVendors', 'bundleApp', 'minifyJS', 'replaceProd');
});
