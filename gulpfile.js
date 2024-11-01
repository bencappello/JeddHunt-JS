var gulp = require('gulp');
var connect = require('gulp-connect');
var audiosprite = require('./vendor/audiosprite');
var glob = require('glob');
var shell = require('gulp-shell');
var fs = require('fs');

gulp.task('audio', gulp.parallel(function(cb) {
  var files = glob.sync('./src/assets/sounds/*.mp3');
  var outputPath = './dist/audio';
  var opts = {
    output: outputPath,
    path: './',
    format: 'howler2',
    'export': 'ogg,mp3',
    loop: ['quacking', 'sniff']
  };

  return audiosprite(files, opts, function(err, obj) {
    if (err) {
      console.error(err);
    }

    return fs.writeFile('./dist/audio' + '.json', JSON.stringify(obj, null, 2), cb);
  });
}));

gulp.task('images', gulp.parallel(function(){
  return gulp.src('*', {read:false})
    .pipe(shell([
      'TexturePacker --version || echo ERROR: TexturePacker not found, install TexturePacker',
      'TexturePacker --max-size 4096 --disable-rotation --algorithm Basic --extrude 0 --no-trim --disable-auto-alias --png-opt-level 0 --border-padding 10 --data dist/sprites.json --format json --sheet dist/sprites.png src/assets/images'
    ]))
    .pipe(connect.reload());
}));


gulp.task('deploy', gulp.parallel(function() {
  return gulp.src('*', {read:false})
    .pipe(shell([
      'aws --profile duckhunt s3 sync dist/ s3://duckhuntjs.com --include \'*\' --acl \'public-read\''
    ]));
}));

gulp.task('default', gulp.parallel('images', 'audio'));
