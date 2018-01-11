# Developing

## npm scripts

This project uses `npm` as an interface to run build scripts and other tasks. The scripts themselves are a combination of JavaScript, Bash and Python scripts. Here are the essential scripts;

`npm install`: Installs JavaScript and Python dependencies.

`npm run build`: Runs all of the `build:x` scripts below and generates all builds of the app. If you have configuration options in a subdirectory of `/options` other than `options/release`, you can pass in the name of the subdirectory you would like to use with `npm run build -- subdirectory_name`. If you would like to build the app with an incomplete configuration, you should prefix the command like this; `IGNORE_ERRORS=true npm run build`.

`npm run build:js`: Builds the JavaScript bundle for the app.

`npm run build:css`: Builds the CSS bundle for the app.

`npm run build:config`: Builds the configuration (options) for the app. If you have configuration options in a subdirectory of `/options` other than `options/release`, you can pass in the name of the subdirectory you would like to use with `npm run build:config -- subdirectory_name`. If you would like to build the app with an incomplete configuration, you should prefix the command like this; `IGNORE_ERRORS=true npm run build:config`.

`npm run build:tests`: Builds a JavaScript bundle for running tests.

 If you're using a custom options repo, you can pass in a subdirectory name to the build command with `npm run build -- subdirectory_name` or the build config command with `npm run build:config -- subdirectory_name`.

`npm start`: Starts the app for local development. More specifically, starts a web server that serves the contents of the `/web` directory.

`npm watch`: Runs all of the build tasks necessary for local development in watch mode so that the build is automatically when source files change. This does not generate a final build, and is only for local development. You must run `npm run build` or `npm run build:config` first to make a request to [the GIBS `GetCapabilities` API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers) and build the configuration files.

`npm test`: Runs all tests and linting to verify code quality. Make sure to run `npm run build` or `npm run build:tests` first to build a testable version of Worldview.

`npm run lint`: Lints code against the project's style guides. Use `npm run lint:css` or `npm run lint:js` to lint CSS or JS files separately.

`npm run e2e`: Runs end-to-end tests locally. Use `npm run e2e:chrome` or `npm run e2e:firefox` to run tests in a specific browser.

`npm run browserstack`: Runs end-to-end tests on Browserstack.

`npm run getcapabilites`: Makes a request to [the GIBS `GetCapabilities` API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers) and updates layer configurations. If you're using a custom options repo, you can pass in a subdirectory with `npm run getcapabilites -- subdirectory_name`.

`npm run updateconfig`: A shortcut to update the config when new layers are added. Runs `npm run getcapabilities` and `npm run build:config` behind the scenes.

`npm run report`: Generates a readable HTML report with the results of the last end-to-end test.

## Grunt tasks

We're in the process of replacing our Grunt tasks with npm scripts, but here are the Grunt build scripts that are available. Note, these are poorly documented and you should use caution when running these scripts if you don't know what you're doing. Your mileage may vary when running scripts marked with a `*` by themselves.

`grunt`: This task is deprecated, and we don't recommend that you use it. Instead, use `npm run build` to generate a build. Under the hood, this is a shortcut for `grunt build && grunt config && grunt site`.

`grunt config`* : Compiles branding and configuration options into an intermediate build directory and generates `tar` files of that directory.

`grunt build`* : Adds a git commit hash to source files, copies them into an intermediate build directory and generates `tar` files of that directory.

`grunt site`* : Combines the results of `grunt config` and `grunt build` into final `/build` and `/dist` directories and generates `tar` files of the final build.

`grunt rpm-placeholders`: Replaces placeholder strings in rpm source files.

`grunt apache-config`* : Moves `worldview.conf` to the `/dist` directory for deployment to an Apache server.
