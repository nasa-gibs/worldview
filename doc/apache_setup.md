# How to Setup Worldview Using Apache

> Note: Using Worldview with Apache is deprecated and will not be supported in the future. Is is recommended that you use Worldview with Node/[Express](https://expressjs.com/) instead. If you choose to proceed with Apache, choose one of the setup methods below.

## RPM Setup

* Run `bash ./tasks/buildAll.sh` to generate an `.rpm` file in `/build/rpm`.
* Deploy the `.rpm` file to your server.
* Note: you may have to modify `httpd.conf` and `worldview.spec` to match your environment before running these steps.

## Manual Setup

* Follow [the instructions in the Readme](https://github.com/nasa-gibs/worldview/tree/module-loaders#installation) to install and build Worldview.
* Either copy the contents of the `build/` directory or extract `dist/site-worldview.tar.bz2`) into the directory you want to serve from Apache.
* Copy `httpd.conf` into the same directory, and update both `<Directory>` entries with the full path of that directory where `@WORLDVIEW@` is the name of the directory. Be sure to retain the `/web` and `/web/service` portions.
* Comment out the first two `Alias` lines of the `httpd.conf` file with a `#`.
* Restart Apache with `sudo apachectl restart`.
* Note: You may have mixed results, and you may have to debug at this point.
