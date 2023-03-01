# [Worldview](https://worldview.earthdata.nasa.gov)

[![Worldview Screenshot](/web/images/readme-preview.jpg)](https://worldview.earthdata.nasa.gov)

[![Build Status](https://github.com/nasa-gibs/worldview/actions/workflows/build-test-app.yml/badge.svg?branch=main)](https://github.com/nasa-gibs/worldview/actions/workflows/build-test-app.yml)

Interactive interface for browsing full-resolution, global satellite imagery.

## Background

This app from NASA's [EOSDIS](https://earthdata.nasa.gov/) provides the
capability to interactively browse over 1000 global, full-resolution satellite
imagery layers on desktop and mobile devices. Many of the imagery layers are
updated daily and are within three hours of observation - showing the entire Earth as it is
"right now". This supports time-critical applications such as wildfire
management, air quality measurements, and flood monitoring. Some satellite
imagery layers span almost 30 years, providing a long term view of our dynamic
planet. The underlying data is available for download, and Arctic and Antarctic
views of several imagery layers are available for a “full globe” perspective. Geostationary imagery layers are also now available. These are provided in ten minute increments for the last 90 days. These full disk hemispheric views allow for almost real-time viewing of changes occurring around most of the world.

Worldview uses [OpenLayers](http://openlayers.org/) to display imagery from the
[Global Imagery Browse Services (GIBS)](https://earthdata.nasa.gov/gibs). This
imagery can also be used [with libraries such as Leaflet, Cesium, Google Maps](https://nasa-gibs.github.io/gibs-api-docs/map-library-usage/)
or [custom GDAL scripts](https://nasa-gibs.github.io/gibs-api-docs/map-library-usage/#gdal).
We encourage interested developers to fork Worldview or build their own clients
using GIBS services.

Check out our [roadmap](https://github.com/nasa-gibs/worldview/projects/7)
to see what we're working on and follow our [blog](https://wiki.earthdata.nasa.gov/pages/viewrecentblogposts.action?key=GIBS)
to find out the latest features and imagery available.

## Install

This project uses Node.JS. See the [dependencies](#dependencies) section for more information.

```bash
git clone https://github.com/nasa-gibs/worldview.git
cd worldview
npm ci
```

View the [Configuration](doc/config/configuration.md) section for information on how to install the official EOSDIS Worldview configuration, or to add your own custom configuration.

### Dependencies

The following are required to install and run Worldview:

- [Node LTS](https://nodejs.org/en/download/)
  - **Note:** Ubuntu users may run into issues with the `node` command not being available. See [this question on StackOverflow](https://stackoverflow.com/q/18130164/417629) for possible solutions.

Windows users will also need the following:

- [Git Bash](https://git-scm.com/downloads)


## Usage

```bash
npm run build
npm start
```

Navigate to [`http://localhost:3000`](http://localhost:3000) in a browser. To stop Worldview, press Control+C in the terminal.

See [Developing](doc/developing.md) for more usage details.

## Updates

To update Worldview, pull down any branch or tag from GitHub. From the `main` branch (default), to update to the latest stable version of Worldview, run `git pull`.

**Note:** This project uses [Semantic Versioning](https://semver.org/). Updates to the major version number in [package.json](package.json) indicate a breaking change; _update with caution_.

## Other Information

- [Configuration](doc/config/configuration.md)
- [Custom Branding](doc/branding.md)
- [Optional Features](doc/features.md)
- [Developing](doc/developing.md)
- [Deployment](doc/deployment.md)
- [Testing](doc/testing.md)
- [URL Parameters](doc/url_parameters.md)
- [Uploading](doc/upload.md)
- [Docker](doc/docker.md)
- [Data Download (Smart Handoffs)](doc/smart_handoffs.md)
- [Embedding](doc/embed.md)

## Contact

Contact us via GitHub or by sending an email to
[support@earthdata.nasa.gov](mailto:support@earthdata.nasa.gov).

## Contribute

We welcome your contributions! Feel free to [open an issue](https://github.com/nasa-gibs/worldview/issues/new/choose) or [submit a PR](https://github.com/nasa-gibs/worldview/compare).

Please review [CONTRIBUTING.md](.github/CONTRIBUTING.md) for contribution guidelines before getting started.

Worldview and NASA follow the [Contributor Covenant Code of Conduct](.github/CODE_OF_CONDUCT.md).

## License

NASA-1.3 (See [LICENSE.md](LICENSE.md))
