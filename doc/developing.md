# Developing

## npm scripts

This project uses `npm` as an interface to run build scripts and other tasks. The scripts themselves are a combination of JavaScript, Bash and Python scripts. Here are the essential scripts;

`npm install`: Installs JavaScript and Python dependencies.

`npm run build`: Runs all build scripts and generates built versions of the app. You can also build specific assets with `npm run build:css`, `npm run build:js`, `npm run build:tests` and `npm run build:config` (compiles configuration files).

`npm start`: Starts the app for local development. More specifically, starts a web server that serves the contents of the `/web` directory.

`npm watch`: Runs all of the build tasks necessary for local development in watch mode so that the build is automatically when source files change. You should run `npm run build` first to fetch GIBS configuration. This does not generate a final build, and is only for local development.

`npm test`: Runs all tests and linting to verify code quality. Make sure to run `npm run build` or `npm run build:tests` first to build a testable version of Worldview.

`npm run lint`: Lints code against the project's style guides. Use `npm run lint:css` or `npm run lint:js` to lint CSS or JS files separately.

`npm run e2e`: Runs end-to-end tests locally. Use `npm run e2e:chrome` or `npm run e2e:firefox` to run tests in a specific browser.

`npm run browserstack`: Runs end-to-end tests on Browserstack.

`npm run getcapabilites`: Makes a request to the GIBS `GetCapabilities` API and updates layer configurations.

`npm run report`: Generates a readable HTML report with the results of the last end-to-end test.

## Grunt tasks

We're in the process of replacing our Grunt tasks with npm scripts, but here are the Grunt build scripts that are available. Note, these are poorly documented and you should use caution when running these scripts if you don't know what you're doing. Your mileage may vary when running scripts marked with a `*` by themselves.

`grunt`: The default Grunt task runs all of the scripts necessary to generate a build. Among other things, it applies branding and other configuration options, compiles assets and generates build artifacts in `/build` and `/dist`. The default Grunt task does not run tests.

`grunt config`* : Compiles branding and configuration options into an intermediate build directory and generates `tar` files of that directory.

`grunt build`* : Adds a git commit hash to source files, copies them into an intermediate build directory and generates `tar` files of that directory.

`grunt site`* : Combines the results of `grunt config` and `grunt build` into final `/build` and `/dist` directories and generates `tar` files of the final build.

`grunt rpm-only`: Creates an RPM on CentOS 6 and places it in the `/dist` directory.

`grunt apache-config`* : Moves `worldview.conf` to the `/dist` directory for deployment to an Apache server.
