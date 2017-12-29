#!/bin/bash

echo "Copying Config Artifacts to dist"
mkdir -p dist
cp build/worldview-config* dist
echo "Unpacking Build Artifacts"
( cd build && \
  tar xf worldview.tar.bz2 && \
  tar xf worldview-debug.tar.bz2 && \
  tar xf worldview-config.tar.bz2
)
echo "Installing Dependencies"
if ! npm install ; then
  echo "ERROR: \"npm install\" failed" &>2
  exit 1
fi
echo "Combining build results from options and Worldview repos"
if ! grunt site ; then
  echo "ERROR: \"grunt site\" failed" &>2
  exit 1
fi
echo "Generating an RPM of Worldview"
if ! grunt rpm-only ; then
  echo "ERROR: \"grunt rpm-only\" failed" &>2
  exit 1
fi
