#!/bin/bash

# This script should be run inside the docker container to execute
# the headless end-to-end tests

npm cache verify
npm install --unsafe-perm
npm run build:dev
npm start
xvfb-run npx nightwatch --env firefox --skiptags wip -o e2e/reports
