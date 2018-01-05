#!/bin/bash

# Reset build and dist directories
rm -rf build
rm -rf dist

echo "Installing Dependencies"
if ! npm install ; then
  echo "ERROR: \"npm install\" failed" &>2
  exit 1
fi

echo "Building Worldview CSS"
if ! npm run build:css ; then
  echo "ERROR: \"npm run build:css\" failed" &>2
  exit 1
fi

echo "Building Worldview JavaScript"
if ! npm run build:js ; then
  echo "ERROR: \"npm run build:js\" failed" &>2
  exit 1
fi

echo "Building Worldview Repo and generating tar files"
if ! grunt build ; then
  echo "ERROR: \"grunt build\" failed" &>2
  exit 1
fi
