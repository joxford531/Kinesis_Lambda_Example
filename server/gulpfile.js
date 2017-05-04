const fs = require("fs");
const gulp = require("gulp");
const merge = require("merge-stream");
const shell = require("gulp-shell");
const sourcemaps = require("gulp-sourcemaps");
const spawn = require("child_process").spawn;
const ts = require("gulp-typescript");
const vfs = require("vinyl-fs");
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
    node = spawn("node", ["server.js"], {stdio: "inherit"});
    node.on("close", function (code) {
      if (code === 8) {
        gulp.log("Error detected, waiting for changes...");
      }
    });
  }
});

// Lambda Packaging

let lambdaFolders = {
  variableLambda: "./streamProcessors/variableProcessor"
};

createLambdaSymlinks = (target) => {
  let modelFolders = 
    vfs.src("./model")
    .pipe(vfs.symlink(target, {force: true}));

  let repositoryFolders = 
    vfs.src("./repository")
    .pipe(vfs.symlink(target, {force: true}));

  return merge(modelFolders, repositoryFolders);
}

gulp.task("copyVariableLambdaDbConnection", () => {
  return gulp.src("./config.json")
    .pipe(gulp.dest(lambdaFolders.variableLambda));
});

gulp.task("createVariableLambdaSymlinks", () => {
  return createLambdaSymlinks(lambdaFolders.variableLambda);
});

gulp.task("typeScript.variableLambda", ["createVariableLambdaSymlinks"], () => {
  console.log("Compiling variable lambda .ts from " + lambdaFolders.variableLambda +"/tsconfig.json.");
  var tsProject = ts.createProject(lambdaFolders.variableLambda + "/tsconfig.json");
  return tsProject.src()
    .pipe(ts(tsOptions))
    .pipe(gulp.dest(lambdaFolders.variableLambda));
});

gulp.task("packageVariableLambda", ["typeScript.variableLambda", "copyVariableLambdaDbConnection"], () => {
  var zipPath = lambdaFolders.variableLambda + "/variableProcessor.zip";
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  return gulp
  .src(lambdaFolders.variableLambda + "/index.js", { base: lambdaFolders.variableLambda })
  .pipe(shell("powershell.exe -f package.ps1", { cwd: lambdaFolders.variableLambda }));
});

gulp.task("default", ["serve"]);