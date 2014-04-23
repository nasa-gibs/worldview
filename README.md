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

Now install a global version of [grunt](http://gruntjs.com/) using the
following command:

    sudo npm install --global grunt-cli

Clone a copy of the Worldview repository and change to the ``worldview`` directory.
Now install the packages required for building:

    npm install

Some python libraries are required. Install virtualenv to keep additional
libraries installed in a local directory:

    sudo easy_install virtualenv==1.10.1

Run the following script to install:

    ./python_install

Start the build with:

    grunt

The ``dist`` directory now contains a ``worldview.tar.bz2`` file which
can be uploaded and unpacked to a web server.

*Please Note:* To run Worldview from your local machine, you will need to
follow the instructions in [Development Notes](doc/developing.md).


## Other Information

* [Branding](doc/branding.md)
* [Optional Features](doc/features.md)
* [Development Notes](doc/developing.md)
* [Third-Party Library Use](THIRD_PARTY.md)
* [Release Notes](RELEASE_NOTES.md)


## Contact

Contact us by sending an email to
[support@earthdata.nasa.gov](mailto:support@earthdata.nasa.gov)
