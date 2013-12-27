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

### Imagery Use

NASA supports an open data policy and we encourage publication of imagery from
Worldview; when doing so, please cite it as "NASA Worldview" and also consider
including a permalink (such as this one) to allow others to explore the
imagery.

### Acknowledgements
Near-real time data is courtesy of [LANCE](http://lance.nasa.gov/) data
providers: [AMSR-E SIPS](http://lance.nasa.gov/home/about/amsr-e-sips/),
[GES DISC](http://lance.nasa.gov/home/about/ges-disc/),
[MODAPS](http://lance.nasa.gov/home/about/modaps/),
[OMI SIPS](http://lance.nasa.gov/home/about/omi-sips/), and
[FIRMS](http://earthdata.nasa.gov/data/near-real-time-data/firms).
Ocean color and temperature data provided by
[OBPG](http://oceancolor.gsfc.nasa.gov/) and
[PO.DAAC](http://podaac.jpl.nasa.gov/).
Socioeconomic data supplied by [SEDAC](http://sedac.ciesin.org/).
Orbit tracks provided by [space-track.org](https://www.space-track.org/).
Polar coastlines and graticules courtesy of
[ADD SCAR](http://www.add.scar.org/),
[OpenStreetMap](http://www.openstreetmap.org/), and
[PolarView](http://www.polarview.aq/). User-selectable color palettes are
primarily derived from [NEO](http://neo.sci.gsfc.nasa.gov/). The imagery
ingest and serving system (GIBS) is built by NASA/JPL and operated by
NASA/GSFC. Worldview is built by the NASA/GSFC Earth Science Data
Information System [(ESDIS)](http://earthdata.nasa.gov/esdis) Project and is
grateful for the use of many
[open source projects](http://localhost/worldview/pages/worldview-opensourcelibs.html).

### Disclaimer
The information presented through this interface is provided "as is" and
users bear all responsibility and liability for their use of the data. Please
read the [full disclaimer](https://earthdata.nasa.gov/data/nrt-data/disclaimer).

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

#### Via Apache on Mac OS X

In System Preferences under Sharing, check the Web Sharing item.

Create symlinks in ``/Library/WebServer/Documents`` to the appropriate
locations in the source tree. Replace ``$WORLDVIEW_HOME`` with the location of
the Worldview repository. In this example, the actual source files will mapped
to ``worldview`` while the production build will be mapped to
``worldview-prod``:

    sudo ln -s $WORLDVIEW_HOME/src /Library/WebServer/Documents/worldview
    sudo ln -s $WORLDVIEW_HOME/build/worldview/web /Library/WebServer/Documents/worldview-prod
    sudo ln -s $WORLDVIEW_HOME/build/worldview-debug/web /Library/WebServer/Documents/worldview-debug

Now edit ``/etc/apache2/httpd.conf`` and make the following changes:

* Find the ``AllowOverride None`` directive in the directory section for
``/Library/WebServer/Documents`` and change it to ``AllowOverride All``. This
allows the htaccess file in the service directory to enable CGI scripts.
* Find the ``Listen`` directive and change to the following to prevent Apache
from binding to all interfaces: ``Listen 127.0.0.1:80``

Restart Apache:

    sudo apachectl restart

Worldview should now be available at the following:

* [http://localhost/worldview](http://localhost/worldview)
* [http://localhost/worldview-debug](http://localhost/worldview-debug)
* [http://localhost/worldview-prod](http://localhost/worldview-prod)

### Minification of CSS and JavaScript files

The build script needs to know which files to minify and the correct order used
to concatenate. Anytime a CSS or JavaScript file is added. renamed, or removed,
the following files must be updated:

For external libraries:

* ``etc/deploy/ext.css.json``
* ``etc/deploy/ext.js.json``

For Worldview code:

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

To create a version that is ready to deployed to a web server, issue the
following:

    grunt

The following web roots will be created:

* ``build/worldview/web``: Production release that contains concatenated and
minified JavaScript and CSS files
* ``build/worldview-debug/web``: Development release with JavaScript and CSS
intact for debugging.

Tarball artifacts will also be created in the ``dist``directory.

## Configuration

The Worldivew configuration file is generated by concatenating all files
in ``etc/config/config`` and filling in palette information found in
``etc/config/act`` and ``etc/config/vrt``.

To regenerate the master configuration file in the source tree after making
an edit, issue the following command:

    grunt config

## Copyright

This code was originally developed at NASA/Goddard Space Flight Center for
the Earth Science Data and Information System (ESDIS) project.

Copyright (C) 2013 - 2014 United States Government as represented by the
Administrator of the National Aeronautics and Space Administration.
All Rights Reserved.

## Contact

Contact us by sending an email to
[support@earthdata.nasa.gov](mailto:support@earthdata.nasa.gov)
