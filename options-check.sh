#!/bin/bash
PACKAGE_NAME=$(sed -nE 's/^\s*"name": "(.*?)",$/\1/p' options/package.json)
changed=0
if [ $PACKAGE_NAME = 'worldview-options-eosdis' ]; then
    cd options && git remote update && git status -uno | grep -q 'Your branch is behind' && changed=1
    if [ $changed = 1 ]; then
      git pull && cd -
      echo "Updated successfully";
    else
      cd -
      echo "Up-to-date"
    fi
else
    echo "Worldview options not found.";
fi
