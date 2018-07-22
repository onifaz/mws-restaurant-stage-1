const gulp = require('gulp'),
  uglifyjs = require('gulp-uglify-es').default,
  concat = require('gulp-concat'),
  order = require('gulp-order'),
  htmlreplace = require('gulp-html-replace'),
  sourcemaps = require('gulp-sourcemaps'),
  htmlmin = require('gulp-html-minifier'),
  cleancss = require('gulp-clean-css'),
  gzip = require('gulp-gzip'),
  autoprefixer = require('gulp-autoprefixer'),
  rename = require('gulp-rename'),
  imagemin = require('gulp-imagemin'),
  imageresize = require('gulp-image-resize'),
  imagewebp = require('gulp-webp'),
  critical = require('critical');

/** saving all paths in one obj */
const config = {
  src: {
    main: 'app/',
    img: 'app/img/',
    imgRest: 'app/img/restaurants/',
    imgMap: 'app/img/map/',
    icons: 'app/icons/',
    js: 'app/js/',
    css: 'app/css/'
  },
  dest: {
    main: 'dist/',
    img: 'dist/img/',
    imgRest: 'dist/img/restaurants/',
    imgMap: 'dist/img/map/',
    icons: 'dist/icons/',
    js: 'dist/js/',
    css: 'dist/css/'
  }
};
/** Optimize images  */
gulp.task('imagemin', () =>
  gulp
    .src(`${config.src.imgRest}*.jpg`)
    .pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
    .pipe(gulp.dest(`${config.src.imgRest}`))
);
gulp.task('imagemapmin', () =>
  gulp
    .src(`${config.src.imgMap}*.jpg`)
    .pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
    .pipe(gulp.dest(`${config.src.imgMap}`))
);

/** Create smaller image formats  */
var resizeImageTasks = [];
[720, 540, 350].forEach(function(size) {
  var resizeImageTask = 'resize_' + size;
  gulp.task(resizeImageTask, ['imagemin'], function() {
    return gulp
      .src(`${config.dest.imgRest}!(*-small|*-medium).{jpg,png,tiff}`)
      .pipe(
        imageresize({
          width: size,
          quality: 0.5
        })
      )
      .pipe(rename({ suffix: '-' + size }))
      .pipe(gulp.dest(`${config.src.imgRest}`));
  });
  resizeImageTasks.push(resizeImageTask);
});
gulp.task('resize_images', resizeImageTasks);

/** Create webp versions  */
gulp.task('imagewebp', () =>
  gulp
    .src(`${config.src.imgRest}*`)
    .pipe(imagewebp({ quality: 60 }))
    .pipe(gulp.dest(`${config.src.imgRest}`))
);
gulp.task('imagemapwebp', () =>
  gulp
    .src(`${config.src.imgMap}*`)
    .pipe(imagewebp({ quality: 60 }))
    .pipe(gulp.dest(`${config.src.imgMap}`))
);

/** copy all files not used in other tasks */
gulp.task('copyfiles', [
  'copyfiles-img',
  'copyfiles-main',
  'copyfiles-sw',
  'copyfiles-imgmap',
  'copyfiles-otherimg'
]);
gulp.task('copyfiles-main', () =>
  gulp
    .src(`${config.src.main}*.{ico,json}`)
    .pipe(gulp.dest(`${config.dest.main}`))
);
gulp.task('copyfiles-sw', () =>
  gulp
    .src(`${config.src.main}*-build.js`)
    .pipe(rename('sw.js'))
    .pipe(gulp.dest(`${config.dest.main}`))
);
gulp.task('copyfiles-otherimg', () =>
  gulp
    .src(`${config.src.img}*.{svg,jpg,webp}`)
    .pipe(gulp.dest(`${config.dest.img}`))
);
gulp.task('copyfiles-imgmap', () =>
  gulp
    .src(`${config.src.imgMap}*.{jpg,webp}`)
    .pipe(gulp.dest(`${config.dest.imgMap}`))
);
gulp.task('copyfiles-img', () =>
  gulp
    .src(`${config.src.imgRest}*.{jpg,webp}`)
    .pipe(gulp.dest(`${config.dest.imgRest}`))
);

/** gzip all zippable resourses */
gulp.task('gzip', ['gzip-main', 'gzip-icons', 'gzip-js', 'gzip-sw']);
gulp.task('gzip-main', ['copyfiles'], () =>
  gulp
    .src(`${config.dest.img}*.svg`)
    .pipe(gzip())
    .pipe(gulp.dest(`${config.dest.img}`))
);
gulp.task('gzip-icons', ['icons'], function() {
  gulp
    .src(`${config.dest.icons}*.svg`)
    .pipe(gzip())
    .pipe(gulp.dest(`${config.dest.icons}`));
});
gulp.task('gzip-css', ['minifycss'], () =>
  gulp
    .src(`${config.dest.css}*.css`)
    .pipe(gzip())
    .pipe(gulp.dest(`${config.dest.css}`))
);
gulp.task('gzip-js', ['minifyjs'], () =>
  gulp
    .src(`${config.dest.js}*.js`)
    .pipe(gzip())
    .pipe(gulp.dest(`${config.dest.js}`))
);
gulp.task('gzip-sw', ['copyfiles-sw'], () =>
  gulp
    .src(`${config.dest.main}*.js`)
    .pipe(gzip())
    .pipe(gulp.dest(`${config.dest.main}`))
);
gulp.task('gzip-html', () =>
  gulp
    .src(`${config.dest.main}*.html`)
    .pipe(gzip())
    .pipe(gulp.dest(`${config.dest.main}`))
);

/** critical css */
gulp.task('criticalMain', ['minifycss', 'minifyhtml'], function(cb) {
  critical.generate({
    inline: true,
    base: 'temp',
    src: 'index.html',
    css: ['dist/css/styles.css'],
    dimensions: [
      {
        width: 320,
        height: 480
      },
      {
        width: 768,
        height: 1024
      },
      {
        width: 1280,
        height: 960
      }
    ],
    dest: '../dist/index.html',
    minify: true,
    extract: true,
    ignore: ['font-face']
  });
});
gulp.task('criticalDetail', ['minifyhtml'], function(cb) {
  critical.generate({
    inline: true,
    base: 'temp',
    src: 'restaurant.html',
    css: ['dist/css/styles.css'],
    dimensions: [
      {
        width: 320,
        height: 480
      },
      {
        width: 768,
        height: 1024
      },
      {
        width: 1280,
        height: 960
      }
    ],
    dest: '../dist/restaurant.html',
    minify: true,
    extract: true,
    ignore: ['font-face']
  });
});
gulp.task('critical', ['criticalMain', 'criticalDetail']);

/** Copy and optimize icons */
gulp.task('icons', () =>
  gulp
    .src(`${config.src.icons}*`)
    .pipe(imagemin([imagemin.optipng({ optimizationLevel: 5 })]))
    .pipe(gulp.dest(`${config.dest.icons}`))
);

gulp.task('minifyjs', ['bundlejs', 'mainjs']);

/** bundle js */
gulp.task('bundlejs', () =>
  gulp
    .src(`${config.src.js}{idb.js,dbhelper.js,observer.js,swregister.js}`)
    .pipe(sourcemaps.init())
    .pipe(
      order(
        [
          `${config.src.js}idb.js`,
          `${config.src.js}dbhelper.js`,
          `${config.src.js}observer.js`,
          `${config.src.js}swregister.js`
        ],
        { base: __dirname }
      )
    )
    .pipe(concat('bundle.js'))
    .pipe(uglifyjs())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${config.dest.js}`))
);
/** main js */
gulp.task('mainjs', () =>
  gulp
    .src(`${config.src.js}{main.js,restaurant_info.js}`)
    .pipe(sourcemaps.init())
    .pipe(uglifyjs())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${config.dest.js}`))
);

gulp.task('minifycss', function() {
  gulp
    .src(`${config.src.css}*`)
    .pipe(concat('styles.css'))
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions', 'not ie <= 10']
      })
    )
    .pipe(cleancss())
    .pipe(gulp.dest(`${config.dest.css}`));
});

gulp.task('minifyhtml', () =>
  gulp
    .src(`${config.src.main}*.html`)
    .pipe(
      htmlreplace({
        css: 'css/styles.css',
        js: 'js/bundle.js'
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest('temp'))
);

/** create dist folder content */
gulp.task('prepare-dist', ['copyfiles', 'icons', 'gzip', 'critical']);
gulp.task('build-dist', ['gzip-html', 'gzip-css']);
