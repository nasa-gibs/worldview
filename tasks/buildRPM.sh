#!/bin/bash

# Prepare rpm sources
mkdir -p build/rpm/{SOURCES,SPECS}
cp worldview.spec build/rpm/SPECS
cp dist/*.tar.bz2 build/rpm/SOURCES
cp *.conf build/rpm/SOURCES

# Replace placeholders in rpm spec
npx grunt rpm-placeholders

# Build rpm
rpmbuild --define "_topdir $PWD/build/rpm" -ba build/rpm/SPECS/worldview.spec
