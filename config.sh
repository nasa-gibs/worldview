#!/bin/bash
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
  echo "Cleaning dist"
  if ! grunt distclean ; then
    echo "ERROR: \"grunt distclean\" failed" &>2
    exit 1
  fi
  echo "relocation node_module dependencies"
  if ! grunt update ; then
    echo "ERROR: \"grunt update\" failed" &>2
    exit 1
  fi
  echo "Fetching GetCapabilities"
  if ! grunt fetch ; then
    echo "ERROR: \"grunt fetch\" failed" &>2
    exit 1
  fi
  echo "Generating Configuration"
  if ! grunt config ; then
    echo "ERROR: \"grunt config\" failed" &>2
    exit 1
  fi