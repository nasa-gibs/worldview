#!/bin/bash

PROG=$(basename "$0")
BASE=$(dirname "$0")/..

SRC_DIR="$BASE/config/default"
OPT_DIR="$BASE/config/default"
BUILD_DIR="$BASE/build/options-build"
DEST_DIR="$BASE/build/options"
SCRIPTS_DIR="$BASE/tasks/build-options"


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

# If $FETCH_GC is set, make various API requests
if [ "$FETCH_GC" ] ; then
    # Fetch GC files and create colormaps, vectordata and vectorstyle files
    rm -rf "$OPT_DIR/$OPT_SUBDIR/gc/*"
    rm -rf "$OPT_DIR/$OPT_SUBDIR/colormaps/gc/*"
    `node $SCRIPTS_DIR/getCapabilities.js \
      --config "$OPT_DIR/$OPT_SUBDIR/config.json" \
      --getcapabilities "$OPT_DIR/$OPT_SUBDIR/gc"`

    # Get metadata for files in layerOrder.json and combine this data into 1 file
    rm -rf "$OPT_DIR/$OPT_SUBDIR/layer-metadata"
    mkdir -p "$OPT_DIR/$OPT_SUBDIR/layer-metadata"
    `node $SCRIPTS_DIR/getVisMetadata.js \
      --features "$BUILD_DIR/features.json" \
      --layerOrder "$BUILD_DIR/config/wv.json/layerOrder.json" \
      --layerMetadata "$OPT_DIR/$OPT_SUBDIR/layer-metadata/all.json"`
else
  # Validate layers in wv.json with a JSON schema
  `node $SCRIPTS_DIR/validateConfigs.js \
    --inputDirectory "$SRC_DIR/common/config/wv.json/layers" \
    --schemaFile "$BASE/schemas/layer-config.json"`

  if [ -e "$BUILD_DIR/features.json" ] ; then
      cp "$BUILD_DIR/features.json" "$BUILD_DIR/config/wv.json/_features.json"
  fi

  # Run extractConfigFromWMTS.js script with config.json
  if [ -e "$BUILD_DIR/config.json" ] ; then
    `node $SCRIPTS_DIR/extractConfigFromWMTS.js \
      --config "$BUILD_DIR/config.json" \
      --inputDir "$BUILD_DIR/gc" \
      --outputDir  "$BUILD_DIR/_wmts"`
  fi

  # Run processVectorStyles.js and move vectorstyles where we want them
  if [ -e "$BUILD_DIR/gc/vectorstyles" ] ; then
      mkdir -p "$BUILD_DIR/config/wv.json/vectorstyles"
      `node $SCRIPTS_DIR/processVectorStyles.js \
        --inputDir "$BUILD_DIR/gc/vectorstyles" \
        --outputDir "$BUILD_DIR/config/wv.json/vectorstyles"`
  fi

  # Run processVectorData.js and move vectordata where we want them
  if [ -e "$BUILD_DIR/gc/vectordata" ] ; then
      mkdir -p "$BUILD_DIR/config/wv.json/vectordata"
      `node $SCRIPTS_DIR/processVectorData.js \
        --inputDir "$BUILD_DIR/gc/vectordata" \
        --outputDir "$BUILD_DIR/config/wv.json/vectordata"`
  fi

  # Run processColormap.js and move colormaps where we want them
  if [ -e "$BUILD_DIR/colormaps" ] ; then
      mkdir -p "$BUILD_DIR"/config/palettes
      if [ -d "$BUILD_DIR"/gc/colormaps ] ; then
          cp -r "$BUILD_DIR"/gc/colormaps "$BUILD_DIR"/colormaps/gc
      fi
      `node $SCRIPTS_DIR/processColormap.js \
        --config "$OPT_DIR/$OPT_SUBDIR/config.json" \
        --inputDir "$BUILD_DIR/colormaps" \
        --outputDir "$BUILD_DIR/config/palettes"`
  fi

  # Throw error if no categoryGroupOrder.json file present
  if [ ! -e "$BUILD_DIR/config/wv.json/categoryGroupOrder.json" ] ; then
      echo "categoryGroupOrder.json not found.  Generating..."
      `node $SCRIPTS_DIR/generateCategoryGroupOrder.js \
        --inputDir "$SRC_DIR/common/config/wv.json/categories/" \
        --outputDir "$SRC_DIR/common/config/wv.json/"`
  fi

  if [ -e "$OPT_DIR/$OPT_SUBDIR/layer-metadata/all.json" ] ; then
      cp "$OPT_DIR/$OPT_SUBDIR/layer-metadata/all.json" "$BUILD_DIR/config/wv.json/layer-metadata.json"
  fi

  # Run mergeConfig.js on each directory in /config containing .json files
  # This creates on palettes-custom.json and wv.json
  configs=$(ls "$BUILD_DIR/config")
  for config in $configs; do
      case $config in
          *.json)
              bash -c "node $SCRIPTS_DIR/mergeConfig.js \
                --inputDir '$BUILD_DIR/config/$config' \
                --outputFile '$DEST_DIR/config/$config'"
              ;;
          *)
              cp -r "$BUILD_DIR/config/$config" "$DEST_DIR/config/$config"
              ;;
      esac
  done

  # Run mergeConfigWithWMTS.js to merge layer metadata from WMTS GC with worldview layer configs into wv.json
  `node $SCRIPTS_DIR/mergeConfigWithWMTS.js \
    --inputDir "$BUILD_DIR/_wmts" \
    --outputFile "$DEST_DIR/config/wv.json"`

  # Copy brand files from build to dest
  cp -r "$BUILD_DIR/brand" "$DEST_DIR"
  cp "$BUILD_DIR/brand.json" "$DEST_DIR"


  # Validate the options build
  `node $SCRIPTS_DIR/validateOptions.js \
    --optionsFile "$BUILD_DIR/config.json" \
    --configDir "$DEST_DIR/config"`

  # Fetch preview images from WV Snapshots for any layers which they are missing
  `node $SCRIPTS_DIR/fetchPreviewSnapshots.js \
    --wvJsonFile "$DEST_DIR/config/wv.json" \
    --overridesFile "$OPT_DIR/common/previewLayerOverrides.json" \
    --featuresFile "$BUILD_DIR/features.json"`
fi
exit 0
