#!/bin/bash

# Bash commands to run in Bamboo to prepare an rpm for deployment

# Reset directories that have build or install artifacts
rm -rf build dist node_modules .python web/build

npm install --production=false # Install dependencies, set production false so devDependencies are installed even though NODE_ENV is set to production
npm run build # Build the app

tasks/buildRPM.sh

