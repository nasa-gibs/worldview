#!/bin/bash
changed=0
cd options && git remote update && git status -uno | grep -q 'Your branch is behind' && changed=1
if [ $changed = 1 ]; then
    git pull && cd -
    echo "Updated successfully";
else
    cd -
    echo "Up-to-date"
fi
