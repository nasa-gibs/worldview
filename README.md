# [Worldview](https://earthdata.nasa.gov/worldview)

[![Build Status](https://travis-ci.org/nasa-gibs/worldview.svg?branch=master)](https://travis-ci.org/nasa-gibs/worldview)

Visit Worldview at
[https://earthdata.nasa.gov/worldview](https://earthdata.nasa.gov/worldview)

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

*Please Note:* Worldivew is under active development. Features may be absent
or broken until the next major release. The toolchain only works in a Mac OS X
or a Linux environment at the moment.

Download and install [Node.js](http://nodejs.org/) using the intructions on
their site.

Executing the following script will download all dependencies and
build the application:

    ./wv-setup

*Note*: Some steps require root privileges and you may be prompted for the
root password. If you do not trust the script to perform administrative
tasks on your behalf, either review the script before execution, or follow
the [Manual Setup](doc/manual_setup.md) steps.

The ``dist`` directory now contains a ``example-map.tar.bz2`` file which
can be uploaded and unpacked to a web server.

To run Worldview from your local machine, execute the following script or
follow the instructions in [Manual Setup](doc/manual_setup.md):

*Note*: This only works on OS X at the moment.

    ./wv-setup -d

Worldview should now be available at the following:

* [http://localhost/example-map](http://localhost/example-map): Uses the source
directory
* [http://localhost/example-map-debug](http://localhost/example-map-debug):
Uses the debug version (non-minified versions) found in the build directory.
* [http://localhost/example-map-release](http://localhost/example-map-release):
Uses the release version (minified versions) found in the build directory.


## Other Information

* [Manual Setup](doc/manual_setup.md)
* [Branding](doc/branding.md)
* [Optional Features](doc/features.md)
* [Development Notes](doc/developing.md)
* [Configuration](doc/config.md)
* [Third-Party Library Use](THIRD_PARTY.md)


## Contact

Contact us by sending an email to
[support@earthdata.nasa.gov](mailto:support@earthdata.nasa.gov)
