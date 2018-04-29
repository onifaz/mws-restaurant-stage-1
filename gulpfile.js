const gulp = require('gulp'),
  uglify = require('gulp-uglify-es').default,
  sourcemaps = require('gulp-sourcemaps'),
  replace = require('gulp-replace'),
  rename = require('gulp-rename'),
  imagemin = require('gulp-imagemin'),
  imageresize = require('gulp-image-resize'),
  imagewebp = require('gulp-webp');

/** Copy and optimize images  */
gulp.task('imagemin', () =>
  gulp
    .src('app/img/restaurants/*.jpg')
    .pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
    .pipe(gulp.dest('dist/img/restaurants/'))
);

/** Create smaller image formats  */
var resizeImageTasks = [];

[75, 50].forEach(function(size) {
  var resizeImageTask = 'resize_' + size;
  gulp.task(resizeImageTask, ['imagemin'], function() {
    return gulp
      .src('dist/img/restaurants/!(*-small|*-medium).{jpg,png,tiff}')
      .pipe(
        imageresize({
          percentage: size,
          quality: 0.5
        })
      )
      .pipe(rename({ suffix: size == 50 ? '-small' : '-medium' }))
      .pipe(gulp.dest('dist/img/restaurants/'));
  });
  resizeImageTasks.push(resizeImageTask);
});

gulp.task('resize_images', resizeImageTasks);

/** Create webp versions  */
gulp.task('imagewebp', ['imagemin', 'resize_images'], () =>
  gulp
    .src('dist/img/restaurants/*')
    .pipe(imagewebp({ quality: 60 }))
    .pipe(gulp.dest('dist/img/restaurants/'))
);

/** copy favicon, swrvice worker, app manifest */
gulp.task('copyfiles', () =>
  gulp.src('app/*.{ico,json,js}').pipe(gulp.dest('dist/'))
);

/** Copy and optimize icons */
gulp.task('icons', () =>
  gulp
    .src('app/icons/*')
    .pipe(imagemin([imagemin.optipng({ optimizationLevel: 5 })]))
    .pipe(gulp.dest('dist/icons'))
);

/*
gulp.task('templates', function() {
  gulp
    .src(['file.txt'])
    .pipe(replace(/<!-- Beginning scripts [\s\S]* End scripts -->/g, '$1foo'))
    .pipe(gulp.dest('build/'));
});
*/

/*create gzip for html, css, svg and js*/
