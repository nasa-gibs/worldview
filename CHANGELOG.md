# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Fix [issues/38](https://github.com/podaac/worldview/issues/38). Update to upstream 4.41.1 
- Added SOTO git action workflow
- Added SOTO npm e2e execution
- Updated test cases for SOTO compatibility
- Added parameter for assertDefaultLayers
- Disabled some test cases for SOTO due to issue #33 and #34

## [0.2.5]
- Updated to 4.4.0 upstream version
- Set initial start date back an extra day
- Enable blue marble base layer by default

## [0.2.4]
- Updated to 3.39.0 upstream version
- Set `urlShortening` to false in features.json to disable the shorten links feature

## [0.2.3]
- Updated Send Feedback service URL (PODAAC-4470)
- Removed Short Link button (PODAAC-4468)
- Updated date to be today-1 to display SST properly on startup
- Removed old layers no longer in GetCapabilities
- Security upgrade to pass Snyk (Upgrade moment lib)

## [0.2.2]
- Updated to 3.23.0 upstream version (PODAAC-4467)
- Removed worldview Dockerfile to pass Snyk (PODAAC-4495)

## [0.2.1]
- Updated to 3.17.0 upstream version
- Added SOTO by Worldview About page

## [0.2.0]
- Update to 3.13.3 upstream version
- Added SOTO by worldview branding
- Limited dataset selection to PODAAC datasets

## [0.1.0]
- Initial deployment of UI
