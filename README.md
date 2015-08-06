# [Worldview](https://worldview.earthdata.nasa.gov)

[![Join the chat at https://gitter.im/nasa-gibs/worldview](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/nasa-gibs/worldview?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/nasa-gibs/worldview.svg?branch=master)](https://travis-ci.org/nasa-gibs/worldview)

Visit Worldview at
[https://worldview.earthdata.nasa.gov](https://worldview.earthdata.nasa.gov)

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

Copyright &copy; 2013 - 2015 United States Government as represented by the
Administrator of the National Aeronautics and Space Administration.
All Rights Reserved.

Licensed under the [NASA Open Source Agreement, Version 1.3](LICENSE.md).

## Installation

These instructions install a development version of Worldview using a virtual
machine. If you prefer to install locally on your computer, follow the
directions in [Manual Setup](doc/manual_setup.md)

*Notes:* This has only been tested on Mac OS X and Windows 8.1. Let us know if this works in
other environments.

Install the following:

* [VirutalBox](https://www.virtualbox.org)
* [Vagrant](https://www.vagrantup.com)

Clone this repository:

```bash
git clone https://github.com/nasa-gibs/worldview.git
cd worldview
```

Select one of the following configuration repositories:

```bash
# Official EOSDIS configurations
git clone https://github.com/nasa-gibs/worldview-options-eosdis.git options

# Or a blank repository with only Corrected Reflectance and no branding
git clone https://github.com/nasa-gibs/worldview-options-template.git options
```

Build the virtual machine with:

```bash
vagrant up (or 'vagrant up --provision' if you already built it previously)
```

After the command finishes, Worldview should be ready and available at
one of the following:

```bash
# Official EOSDIS configurations
http://localhost:8182/worldview

# Blank repository
http://localhost:8182/example-map
```

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
