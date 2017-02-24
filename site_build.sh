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
  echo "installing npm dependencies"
  npm install
  echo "setting up Python environment"
  ./wv-python
  echo "Generating site via 'grunt site'"
  grunt site
  echo "Generating rpm via 'grunt rpm-only'"
  grunt rpm-only