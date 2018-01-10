#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Reset directories that have build or install artifacts
rm -rf build dist node_modules .python web/build

npm install # Install dependencies
npm run build # Build the app

# Prepare rpm sources
mkdir -p build/rpm/{SOURCES,SPECS}
cp worldview.spec build/rpm/SPECS
cp dist/*.tar.bz2 build/rpm/SOURCES
cp *.conf build/rpm/SOURCES

# Replace placeholders in rpm spec
grunt rpm-placeholders

# Build rpm
rpmbuild --define "_topdir $PWD/build/rpm" -ba build/rpm/SPECS/worldview.spec
