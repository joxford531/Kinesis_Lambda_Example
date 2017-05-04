const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const spawn = require("child_process").spawn;
let node;

let tsOptions = {
  "noImplicitAny" : false,
  "target": "es6",
  "module" : "commonjs"
};

gulp.task("typescript", () => {
  return ts.createProject("tsconfig.json")
    .src()
    .pipe(sourcemaps.init())
    .pipe(ts(tsOptions))
    .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: "." }))
    .pipe(gulp.dest("."));
})

gulp.task("build", ["typescript"]);

gulp.task("serve", ["build"], () => {
  if (!node) {
    node = spawn('node', ['read_sensors.js'], {stdio: 'inherit'});
    node.on('close', function (code) {
      if (code === 8) {
        gulp.log('Error detected, waiting for changes...');
      }
    });
  }
});

gulp.task('default', ['serve']);