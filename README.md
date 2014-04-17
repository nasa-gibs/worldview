# [Worldview](https://earthdata.nasa.gov/worldview)

## About

This tool from [NASA's](http://nasa.gov) [EOSDIS](https://earthdata.nasa.gov)
provides the capability to interactively browse global, full-resolution
satellite imagery and then download the underlying data. Most of the 100+
available products are updated within three hours of observation, essentially
showing the entire Earth as it looks "right now". This supports time-critical
application areas such as wildfire management, air quality measurements, and
flood monitoring. Arctic and Antarctic views of several products are also
available for a "full globe" perspective. Browsing on tablet and smartphone
devices is generally supported for mobile access to the imagery.

Worldview uses the
[Global Imagery Browse Services (GIBS)](https://earthdata.nasa.gov/gibs) to
rapidly retrieve its imagery for an interactive browsing experience. While
Worldview uses [OpenLayers](http://openlayers.org/) as its mapping library,
GIBS imagery can also be accessed from Google Earth, NASA World Wind, and
several other clients. We encourage interested developers to build their own
clients or integrate NASA imagery into their existing ones using these
services.

## License

This code was originally developed at NASA/Goddard Space Flight Center for
the Earth Science Data and Information System (ESDIS) project.

Copyright &copy; 2013 - 2014 United States Government as represented by the
Administrator of the National Aeronautics and Space Administration.
All Rights Reserved.

Licensed under the [NASA Open Source Agreement, Version 1.3](LICENSE.md).


## Building

The toolchain assumes a Mac OS X or Linux environment.


### [Release Notes](http://localhost/worldview/pages/release_notes.html)
A full history of
[release notes](http://localhost/worldview/pages/release_notes.html) are
published in each version of Worldview

## Development

*Note*: These instructions have been tested on Mac OS X and Linux. Your
mileage may vary on Windows.

Clone a copy of this repository and change to the ``worldview`` directory.

If you will be pushing commits back to the repository, ensure that your name
and email address have been properly configured with git:

    git config user.name "My Name"
    git config user.email "<my_name@example.com>"

Large commits may cause problems when using https. Issue the following
command to increase the size of the buffer used:

    git config http.postBuffer 524288000


### Web Server Configuration

Worldview must be accessed via a web server to properly work.

#### Via Apache

* Mac OS X: In System Preferences under Sharing, check the Web Sharing item.

Create the following file:

* Mac OS X: ``/private/etc/apache2/other/worldview-dev.conf``
* RHEL/CentOS: ``/etc/httpd/conf.d/worldview-dev.conf``

with the following contents. Replace ``$WORLDVIEW_HOME`` with the path to
the Worldview repository:

    Alias /worldview         $WORLDVIEW_HOME/src
    Alias /worldview-release $WORLDVIEW_HOME/build/worldview/web
    Alias /worldview-debug   $WORLDVIEW_HOME/build/worldview-debug/web
    Alias /worldview-doc     $WORLDVIEW_HOME/build/worldview-doc

    <Directory $WORLDVIEW_HOME>
        Options Indexes FollowSymLinks ExecCGI
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>

Restart Apache:

* Mac OS X: ``sudo apachectl restart``
* RHEL/CentOS: ``sudo service httpd restart``

Worldview should now be available at the following:

* [http://localhost/worldview](http://localhost/worldview)
* [http://localhost/worldview-debug](http://localhost/worldview-debug)
* [http://localhost/worldview-release](http://localhost/worldview-release)
* [http://localhost/worldview-doc](http://localhost/worldview-doc)

### bit.ly URL shortening

The permalink feature allows shortening of the URL. This requires an API
key from bit.ly. To configure, copy ``conf/bitly_config.sample.py`` to
``conf/bity_config.py``, edit the file, and fill in the proper values.

### Minification of CSS and JavaScript files

The build script needs to know which files to minify and the correct order used
to concatenate. Anytime a CSS or JavaScript file is added. renamed, or removed,
the following files must be updated:

* ``etc/deploy/wv.css.json``
* ``etc/deploy/wv.js.json``

To ensure that references to the unminified value are removed in the production
version, prefix all CSS or JavaScript link tags with

    <!-- link.dev -->

If there are some CSS or JavaScript files that must be available in
non-concatenated form, add exceptions in the ``remove:source`` task in
``Gruntfile.js``

## Building

To build Worldivew, the following packages are required:

* [Node.js](http://nodejs.org/)
* [Python](http://www.python.org) (at least version 2.6 which should already
be installed on Mac OS X and Linux)

After installing Node.js, install [grunt](http://gruntjs.com/):

    sudo npm install --global grunt-cli

In the ``worldview`` repository directory, install the packages required
for building:

    npm install

Some python libraries are required. Run the following script which will
globally install virtualenv (requires root), and then installs the libraries
in the python directory:

    ./python_install

To create a version that is ready to deployed to a web server, issue the
following:

    grunt

The following web roots will be created:

* ``build/worldview/web``: Production release that contains concatenated and
minified JavaScript and CSS files
* ``build/worldview-debug/web``: Development release with JavaScript and CSS
intact for debugging.
* ``build/worldview-doc``: Source code documentation

## Naming and Versioning

The ``package.json`` file contains the name, version, and release number
that is used when building the deployment packages. The name can be changed
to allow side-by-side deployments of different branches. Executing:

     grunt

also creates distribution tarballs in the dist directory. Three "unversioned"
files are generated:

* ``dist/worldview.tar.bz2``
* ``dist/worldview-debug.tar.bz2``
* ``dist/worldview-doc.tar.bz2``

Three "versioned" files are also generated in the form of:

* ``dist/<name>-<version>-<release>.git<revision>.tar.bz2``

Where ``name``, ``version``, ``release`` are the values found in the
``package.json`` file and ``revision`` is the value from:

    git rev-parse --short HEAD


## Grunt Targets

These additional grunt targets are available.

### Configuration

The Worldivew configuration file is generated by concatenating all files
in ``etc/config/config`` and filling in palette information found in
``etc/config/act`` and ``etc/config/vrt``.

To regenerate the master configuration file in the source tree after making
an edit, issue the following command:

    grunt config

### Linting

Check for common errors in the JavaScript and CSS files with:

    grunt lint

### Documentation

Documentation can be built separately with:

    grunt doc

### Unit Tests

Run unit test with the following:

    grunt test

This uses BusterJS with PhantomJS for headless browser testing. To test in an
actual browser which is quicker, install the Buster command line tools
with:

    sudo npm install --global buster-cli

For static testing like QUnit, run the following and navigate the web browser
to the address shown:

    buster-static

For browser capturing, run the following and navigate the web browser to
the address shown:

    buster-server


### RPM

To create an RPM on CentOS 6, issue the following:

    grunt rpm

Built RPMs will be found in the ``dist`` directory.




## Contact

Contact us by sending an email to
[support@earthdata.nasa.gov](mailto:support@earthdata.nasa.gov)
