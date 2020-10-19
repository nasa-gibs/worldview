#!/bin/bash

PROG=$(basename "$0")
BASE=$(dirname "$0")/..

TASKS_DIR="$BASE/tasks"
SRC_DIR="$BASE/config/default"
OPT_DIR="$BASE/config/default"
BUILD_DIR="$BASE/build/options-build"
DEST_DIR="$BASE/build/options"
PYTHON_SCRIPTS_DIR="$TASKS_DIR/python3"


# If there is an active directory, use instead of defaults
if [ -d "$BASE/config/active" ]; then
    SRC_DIR="$BASE/config/active"
    OPT_DIR="$BASE/config/active"
fi

# If $IGNORE_ERRORS is true, don't fail on errors
[ "$IGNORE_ERRORS" ] || set -e

die() {
    echo "$PROG: ERROR: $@" >& 2
    exit 1
}

[ -d "$SRC_DIR" ] || die "Options directory does not exist"

# Set $OPT_SUBDIR to the value of CONFIG_ENV or "release"
OPT_SUBDIR="${CONFIG_ENV-release}"

CONFIG=$(echo $SRC_DIR | sed s_tasks/../__)
echo "Using $CONFIG ($OPT_SUBDIR)"

# Activate virtual Python environment
PATH=.python/bin:.python/Scripts:${PATH}

# If $FETCH_GC is set, make request to GIBS GetCapabilities API
if [ "$FETCH_GC" ] ; then
    rm -rf "$OPT_DIR/$OPT_SUBDIR/gc/*"
    rm -rf "$OPT_DIR/$OPT_SUBDIR/colormaps/gc/*"
    "$PYTHON_SCRIPTS_DIR/getCapabilities.py" "$OPT_DIR/$OPT_SUBDIR/config.json" "$OPT_DIR/$OPT_SUBDIR/gc"
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
mkdir -p "$BUILD_DIR/vectorstyles"
mkdir -p "$BUILD_DIR/vectordata"

if [ -e "$BUILD_DIR/features.json" ] ; then
    cp "$BUILD_DIR/features.json" "$BUILD_DIR/config/wv.json/_features.json"
fi

# Run extractConfigFromWMTS.py script with config.json
if [ -e "$BUILD_DIR/config.json" ] ; then
    "$PYTHON_SCRIPTS_DIR/extractConfigFromWMTS.py" "$BUILD_DIR/config.json" "$BUILD_DIR/gc" \
        "$BUILD_DIR/_wmts"
fi

# # Run copyVectorStyles.py and move vectorstyles where we want them
if [ -e "$BUILD_DIR/vectorstyles" ] ; then
    mkdir -p "$BUILD_DIR"/config/vectorstyles
    if [ -d "$BUILD_DIR"/gc/vectorstyles ] ; then
        cp -r "$BUILD_DIR"/gc/vectorstyles "$BUILD_DIR"/vectorstyles/gc
    fi
    "$PYTHON_SCRIPTS_DIR/copyVectorStyles.py" "$OPT_DIR/$OPT_SUBDIR/config.json" \
        "$BUILD_DIR/vectorstyles" \
        "$BUILD_DIR/config/vectorstyles"
fi

# Run processVectorStyles.py and move vectordata where we want them
if [ -e "$BUILD_DIR/vectorstyles" ] ; then
    mkdir -p "$BUILD_DIR"/config/wv.json/vectorstyles
    if [ -d "$BUILD_DIR"/gc/vectorstyles ] ; then
        cp -r "$BUILD_DIR"/gc/vectorstyles "$BUILD_DIR"
    fi
    "$PYTHON_SCRIPTS_DIR/processVectorStyles.py" "$OPT_DIR/$OPT_SUBDIR/config.json" \
        "$BUILD_DIR/config/vectorstyles" \
        "$BUILD_DIR/config/wv.json/vectorstyles"
fi

# Run processVectorData.py and move vectordata where we want them
if [ -e "$BUILD_DIR/vectordata" ] ; then
    mkdir -p "$BUILD_DIR"/config/wv.json/vectordata
    if [ -d "$BUILD_DIR"/gc/vectordata ] ; then
        cp -r "$BUILD_DIR"/gc/vectordata "$BUILD_DIR"
    fi
    "$PYTHON_SCRIPTS_DIR/processVectorData.py" "$OPT_DIR/$OPT_SUBDIR/config.json" \
        "$BUILD_DIR/vectordata" \
        "$BUILD_DIR/config/wv.json/vectordata"
fi

# Run processColormap.py and move colormaps where we want them
if [ -e "$BUILD_DIR/colormaps" ] ; then
    mkdir -p "$BUILD_DIR"/config/palettes
    if [ -d "$BUILD_DIR"/gc/colormaps ] ; then
        cp -r "$BUILD_DIR"/gc/colormaps "$BUILD_DIR"/colormaps/gc
    fi
    "$PYTHON_SCRIPTS_DIR/processColormap.py" "$OPT_DIR/$OPT_SUBDIR/config.json" \
            "$BUILD_DIR/colormaps" \
            "$BUILD_DIR/config/palettes"
fi

# Run getCollectionData.py to fetch collection metadata
# Disabled for now
# if [ -e "$BUILD_DIR/config/wv.json/conceptIds.json" ] ; then
#     "$PYTHON_SCRIPTS_DIR/getCollectionData.py" "$BUILD_DIR/config/wv.json/conceptIds.json" \
#         "$BUILD_DIR/config/wv.json/collections.json"
# fi

# Run getVisMetadata.py to fetch visualization (layer) metadata
"$PYTHON_SCRIPTS_DIR/getVisMetadata.py" "$BUILD_DIR/config/wv.json/layerOrder.json" \
    "$BUILD_DIR/config/wv.json/visMetadata.json"

# Run mergeConfig.py on all directories in /config
configs=$(ls "$BUILD_DIR/config")
for config in $configs; do
    case $config in
        *.json)
            "$PYTHON_SCRIPTS_DIR/mergeConfig.py" "$BUILD_DIR/config/$config" \
                 "$DEST_DIR/config/$config"
             ;;
         *)
             cp -r "$BUILD_DIR/config/$config" "$DEST_DIR/config/$config"
             ;;
    esac
done

# Run mergeConfigWithWMTS.py to merge layer metadata from WMTS GC with worldview layer configs into wv.json
"$PYTHON_SCRIPTS_DIR/mergeConfigWithWMTS.py" "$BUILD_DIR/_wmts" \
    "$DEST_DIR/config/wv.json"

# Copy brand files from build to dest
cp -r "$BUILD_DIR/brand" "$DEST_DIR"
cp "$BUILD_DIR/brand.json" "$DEST_DIR"

# Validate the options build
"$PYTHON_SCRIPTS_DIR/validateOptions.py" "$BUILD_DIR/config.json" "$DEST_DIR/config"

# Fetch preview imagese from WV Snapshots for any layers which they are missing
"$PYTHON_SCRIPTS_DIR/fetchPreviewSnapshots.py"  "$DEST_DIR/config/wv.json" \
    "$OPT_DIR/common/previewLayerOverrides.json" "$BUILD_DIR/features.json"

exit 0
