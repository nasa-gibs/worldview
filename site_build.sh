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
  if ! npm install ; then
    echo "ERROR: \"npm install\" failed" &>2
    exit 1
  fi
  echo "setting up Python environment"
  if ! ./wv-python ; then
    echo "ERROR: \"./wv-python\" failed" &>2
    exit 1
  fi
  echo "relocation node_module dependencies"
  if ! grunt update ; then
    echo "ERROR: \"grunt update\" failed" &>2
    exit 1
  fi
  echo "Generating site via 'grunt site'"
  if ! grunt site ; then
    echo "ERROR: \"grunt site\" failed" &>2
    exit 1
  fi
  echo "Generating rpm via 'grunt rpm-only'"
  if ! grunt rpm-only ; then
    echo "ERROR: \"grunt rpm-only\" failed" &>2
    exit 1
  fi