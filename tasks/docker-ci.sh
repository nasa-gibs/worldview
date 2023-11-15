#!/bin/bash

# This script should be run inside the docker container to execute
# the headless end-to-end tests

npm cache verify
# npm install --unsafe-perm
# npm run build
npx playwright install --with-deps
# npm start &
sleep 60
npx playwright test --project=chromium
