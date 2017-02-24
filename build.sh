#!/bin/sh
  echo "installing npm dependencies"
  npm install
  echo "setting up Python environment"
  ./wv-python
  echo "Cleaning dist"
  grunt distclean
  echo "Fetching GetCapabilities"
  grunt fetch
  echo "Generating Configuration"
  grunt config
