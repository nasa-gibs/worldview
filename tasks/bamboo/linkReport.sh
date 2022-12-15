#!/bin/bash

# TODO: this is a placeholder for the link-check ci/cd plan (to be built) that
# will run once a month
npm ci --production=false --ignore-scripts
node $BASE/tasks/link-check/index.js
