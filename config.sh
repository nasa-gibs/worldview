#!/bin/bash

# Reset build and dist directories
rm -rf build
rm -rf dist

echo "Installing Dependencies"
if ! npm install ; then
  echo "ERROR: \"npm install\" failed" &>2
  exit 1
fi
echo "Building Options Repo"
if ! npm run updateconfig ; then
  echo "ERROR: \"npm run updateconfig\" failed" &>2
  exit 1
fi
