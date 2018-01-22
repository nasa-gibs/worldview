# Developing

## Building

This project uses `npm` as an interface to run build scripts and other tasks.
The scripts themselves are a combination of JavaScript, Bash and Python scripts.

**`npm run build`**: Runs all of the `build:x` scripts below and generates a build
in `build/` and `dist/site-worldview.tar.bz2`. If you have a custom configuration
subdirectory, you can pass that in with `npm run build -- subdirectory_name`. If
you would like to build the app with an incomplete configuration, you should
prefix the command like this; `IGNORE_ERRORS=true npm run build`.

**`npm run build:js`**: Builds the JavaScript bundle for the app and writes it
to `web/build/wv.js`.

**`npm run build:css`**: Builds the CSS bundle for the app and writes it to
`web/build/wv.css`.

**`npm run build:config`**: Builds the configuration (options) for the app in
`build/options/` and `dist/worldview-config.tar.bz2`.

**`npm run build:tests`**: Builds a JavaScript bundle in `web/build/wv-test-bundle.js`
for running tests.

**`npm watch`**: Runs all of the build tasks necessary for local development in watch
mode so the JS and CSS bundles are updated automatically when source files change.
This does not generate any assets in `build/`, and is only for local development.
You must run `npm run build` or `npm run build:config` first to make a request
to [the GIBS `GetCapabilities` API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers) and
build the configuration files.

### Grunt tasks

Grunt tasks are deprecated, but the following are still used by the build scripts
under the hood and available to use if you know what you're doing;

**`grunt`**: This is a shortcut for `grunt build config site`.

**`grunt config`**: Compiles branding and configuration options and puts the results
in `build/`, `dist/`, and `web/`.

**`grunt build`**: Copies assets to build directories and generate intermediate `tar` files.

**`grunt site`**: Combines the results of `grunt config` and `grunt build` into final
`build/` and `dist/` directories and generates `tar` files of the final build.

**`grunt rpm-placeholders`**: Replaces placeholder strings in rpm source files.

## Starting

**`npm start`**: Starts the app for local development. More specifically, starts a
web server that serves the contents of the `web/` directory. For advanced usage,
you can edit `tasks/start.js` to serve the `build/site-worldview/` directory
instead, which will include string placeholder replacements.
