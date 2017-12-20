# Developing

## npm scripts

This project uses npm to run build scripts and other tasks. Here are the essential scripts;

`npm start`: Starts the app for local development. More specifically, starts a web server that serves the contents of the `/web` directory.

`npm test`: Runs all tests and linting to verify code quality.

`npm run lint`: Lints code against the project's style guides. Use `npm run lint:css` or `npm run lint:js` to lint CSS or JS files separately.

`npm run e2e`: Runs end-to-end tests locally. Use `npm run e2e:chrome` or `npm run e2e:firefox` to run tests in a specific browser.

`npm run browserstack`: Runs end-to-end test on Browserstack.

`npm build`: Creates JS and CSS bundles from the source and places them in `/web/build`. Use `npm run build:js` or `npm run build:css` to build JS or CSS individually.

These scripts are also available;

`npm run report`: Generates a readable HTML report with the results of the last end-to-end test.

`npm run preinstall`: Checks to see if your installed version of Node matches the recommended version for Worldview.

## Grunt tasks

We're in the process of replacing our Grunt tasks with npm scripts, but here are the Grunt build scripts that are available. Note, these are poorly documented and you should use caution when running these scripts if you don't know what you're doing. Your mileage may vary when running scripts marked with a `*` by themselves.

`grunt`: The default Grunt task runs all of the scripts necessary to generate a build. Among other things, it updates Python dependencies, applies branding and other configuration options, compiles assets and generates build artifacts in `/build` and `/dist`. The default Grunt task does not run tests.

`grunt config`* : Updates branding and configuration options.

`grunt site`* : Generates build assets for deployment.

`grunt exec:fetch`* : Makes a request to the GIBS `GetCapabilities` API and updates layer configurations.

`grunt build`* : Generates build assets.

`grunt distclean`: Removes build artifacts in `/build` and `/dist`.

`grunt exec:python_packages`: Installs/updates Python dependencies.

`grunt rpm-only`: Creates an RPM on CentOS 6 and places it in the `/dist` directory.

`grunt apache-config`* : Generates `/dist/worldview.conf` in the `/dist` directory for deployment to an Apache server.
