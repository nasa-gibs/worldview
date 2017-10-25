# [Worldview](https://worldview.earthdata.nasa.gov)

[![Build Status](https://api.travis-ci.org/nasa-gibs/worldview.svg?branch=master)](https://travis-ci.org/nasa-gibs/worldview)

Visit Worldview at
[https://worldview.earthdata.nasa.gov](https://worldview.earthdata.nasa.gov)


## About

This tool from [NASA's](http://nasa.gov) [EOSDIS](https://earthdata.nasa.gov)
provides the capability to interactively browse global, full-resolution
satellite imagery and then download the underlying data. Most of the 600+
available products are updated within three hours of observation, essentially
showing the entire Earth as it looks "right now". This supports time-critical
application areas such as wildfire management, air quality measurements, and
flood monitoring. Arctic and Antarctic views of several products are also
available for a "full globe" perspective. Browsing on mobile devices is
generally supported for portable access to the imagery.

Worldview uses the
[Global Imagery Browse Services (GIBS)](https://earthdata.nasa.gov/gibs) to
rapidly retrieve its imagery for an interactive browsing experience. While
Worldview uses [OpenLayers](http://openlayers.org/) as its mapping library,
GIBS imagery can also be accessed from Leaflet, Cesium, and several other
clients as well as [scripts](https://wiki.earthdata.nasa.gov/display/GIBS/Map+Library+Usage#expand-GDALBasics).
We encourage interested developers to build their own clients or integrate
NASA imagery into their existing ones using these services.

Check out our [roadmap](https://github.com/nasa-gibs/worldview/projects/7)
to see where we're going or follow our [blog](https://wiki.earthdata.nasa.gov/pages/viewrecentblogposts.action?key=GIBS)
to find out the latest features and imagery available!


## Installation

These instructions install a development version of Worldview using [Node.js](https://nodejs.org/)
to serve the app locally.  If you prefer to use Apache, follow the directions in [Setup Using Apache](doc/apache_setup.md).

*Note:* This has been demonstrated to work on Windows 7 and 10 (as tested with [mingw-w64](http://mingw-w64.org/)), Mac OS X, and Ubuntu.

Prerequisites:
- [Node.js](https://nodejs.org/)  
  - *Note to Ubuntu users:* After installing Node.js, ensure that it is available as `node` on the command line.  If not, [see here](https://github.com/nasa-gibs/worldview/issues/249#issuecomment-302172817) for more information.
  - A later version of Node (>v6) is required and is not available on some distributions.  To make sure you have a later version, [visit the Node download page](https://nodejs.org/en/download/)
- Windows users:
  - Git Bash, mingw-w64 bash, or a similar shell must be used in order to run bash commands.
  - .NET Framework 2.0 or Visual Studio 2005 or newer installed with Visual C++ compilers.  
  It is HIGHLY recommended you install the Windows Build Tools npm package to ensure the correct compilers have been installed.  
  To install this package:
  ```
  # run in administrator privileged command prompt window
  npm install --global --production windows-build-tools
  ```
  - Python 2.7.x (included with Windows Build Tools)
  - Python path added to Windows environmental variables (to use within cmd.exe and powershell)  
  To add environmental variables:
    - Right-click the Windows icon in bottom-left corner of the screen.
    - Click System, click Advanced System Settings, click Environmental Variables.
    - Highlight the Path row and click edit.
    - Each path is seperated with a semicolon ";"
    - Add your python directory path here.\*  
   \*Windows Build Tools includes python, the included python path is:  
   `%USERPROFILE%\.windows-build-tools\python27`  
   Otherwise the path is most likely:
   `C:\Python27`


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
Install dependencies (NOTE for Windows users: omit the "sudo" part of the following commands as it [isn't available](https://stackoverflow.com/questions/22527668/sudo-command-not-found-on-cygwin)):
```bash
# install local version of grunt
sudo npm install --global grunt-cli
```

```bash
# install virtualenv to keep additional libraries installed in a local directory:
sudo easy_install virtualenv==1.10.1
```

Run local node server:
```bash
npm install
grunt
npm start
```
Worldview should be available at

```bash

http://localhost:3000
```
A node server will continue running until you end the session.
You can end the session by pressing `control-C`

## Other Information

* [Alternate Installation using Apache](doc/apache_setup.md)
* [Branding](doc/branding.md)
* [Optional Features](doc/features.md)
* [Configuration](doc/config.md)
* [Development Notes](doc/developing.md)
* [Coding Style Guide](doc/style_guide.md)
* [Testing](doc/testing.md)
* [Project Roadmap](https://github.com/nasa-gibs/worldview/projects/7)
* [Third-Party Library Use](THIRD_PARTY.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE.md](LICENSE.md)

## Contact

Contact us by sending an email to
[support@earthdata.nasa.gov](mailto:support@earthdata.nasa.gov)
