# How to Setup Worldview Using Apache

> Note: Using Worldview with Apache is deprecated and will not be supported in the future. We recommended using Worldview with Node/[Express](https://expressjs.com/) instead. To use Apache, choose one of the setup methods below.

## Manual Setup

* [Install Apache](http://httpd.apache.org/docs/2.4/install.html)
* Follow [the instructions in the README](https://github.com/nasa-gibs/worldview#install) to install and build Worldview
* [Configure Apache](http://httpd.apache.org/docs/2.4/configuring.html) to serve the contents of the `build/` directory (or extract `dist/site-worldview.tar.bz2` and configure Apache to serve that)
* [Enable execution of CGI scripts in Apache](https://httpd.apache.org/docs/2.4/mod/mod_cgi.html)
* [Start](http://httpd.apache.org/docs/2.4/invoking.html) or [Restart Apache](http://httpd.apache.org/docs/2.4/stopping.html)

## RPM Setup

* Run `bash ./tasks/buildAll.sh` to generate an `.rpm` file in `/build/rpm`.
* Deploy the `.rpm` file to your server.
* **Note:** you may have to modify `httpd.conf` and `worldview.spec` to match your environment before running these steps.
