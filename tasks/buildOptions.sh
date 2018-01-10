#!/bin/bash

PROG=$(basename "$0")
BASE=$(dirname "$0")/..

TASKS_DIR="$BASE/tasks"
SRC_DIR="$BASE/node_modules/worldview-options-eosdis"
BUILD_DIR="$BASE/build/options-build"
DEST_DIR="$BASE/build/options"
OPT_DIR="$BASE/node_modules/worldview-options-eosdis"

# If there is an options directory, use instead of node_modules
if [ -d "$BASE/options" ]; then
    SRC_DIR="$BASE/options"
    OPT_DIR="$BASE/options"
fi

# If $IGNORE_ERRORS is true, don't fail on errors
[ "$IGNORE_ERRORS" ] || set -e

die() {
    echo "$PROG: ERROR: $@" >& 2
    exit 1
}

[ -d "$SRC_DIR" ] || die "Options directory does not exist"

# Set $OPT_SUBDIR to the first argument passed into this script
# Or "release" if there is no argument passed
OPT_SUBDIR="${1-release}"

# Activate virtual Python environment
PATH=.python/bin:.python/Scripts:${PATH}

# If $FETCH_GC is set, make request to GIBS GetCapabilities API
if [ "$FETCH_GC" ] ; then
    rm -rf "$OPT_DIR/$OPT_SUBDIR/gc/*"
    rm -rf "$OPT_DIR/$OPT_SUBDIR/colormaps/gc/*"
    "$TASKS_DIR/getCapabilities.py" "$OPT_DIR/$OPT_SUBDIR/config.json" "$OPT_DIR/$OPT_SUBDIR/gc"
    exit 0
fi

# Copy options files to build directory, and various other file operations
rm -rf "$BUILD_DIR" "$DEST_DIR"
mkdir -p "$BUILD_DIR" "$DEST_DIR"

cp -r "$SRC_DIR"/common/* "$BUILD_DIR"

if hash rsync 2>/dev/null; then
    rsync -a "$SRC_DIR/$OPT_SUBDIR"/* "$BUILD_DIR"
else
    cp -r "$SRC_DIR/$OPT_SUBDIR"/* "$BUILD_DIR"
fi

mkdir -p "$DEST_DIR/config"
mkdir -p "$BUILD_DIR/colormaps"

if [ -e "$BUILD_DIR/features.json" ] ; then
    cp "$BUILD_DIR/features.json" "$BUILD_DIR/config/wv.json/_features.json"
fi

# Run extractConfigFromWMTS.py script with config.json
if [ -e "$BUILD_DIR/config.json" ] ; then
    "$TASKS_DIR/extractConfigFromWMTS.py" "$BUILD_DIR/config.json" "$BUILD_DIR/gc" \
            "$BUILD_DIR/config/wv.json/_wmts" "$BUILD_DIR/colormaps"
fi

# Run processColormap.py and move colormaps where we want them
if [ -e "$BUILD_DIR/colormaps" ] ; then
    mkdir -p "$BUILD_DIR"/config/palettes
    if [ -d "$BUILD_DIR"/gc/colormaps ] ; then
        cp -r "$BUILD_DIR"/gc/colormaps "$BUILD_DIR"/colormaps/gc
    fi
    "$TASKS_DIR/processColormap.py" "$OPT_DIR/$OPT_SUBDIR/config.json" \
            "$BUILD_DIR/colormaps" \
            "$BUILD_DIR/config/palettes"
fi

# Run mergeConfig.py on all directories in /config
configs=$(ls "$BUILD_DIR/config")
for config in $configs; do
    case $config in
        *.json)
            "$TASKS_DIR/mergeConfig.py" "$BUILD_DIR/config/$config" \
                 "$DEST_DIR/config/$config"
             ;;
         *)
             cp -r "$BUILD_DIR/config/$config" "$DEST_DIR/config/$config"
             ;;
    esac
done

# Copy brand files from build to dest
cp -r "$BUILD_DIR/brand" "$DEST_DIR"
cp "$BUILD_DIR/brand.json" "$DEST_DIR"

# Validate the options build
"$TASKS_DIR/validateOptions.py" "$BUILD_DIR/config.json" "$DEST_DIR/config"

exit 0
