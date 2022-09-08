
# Pull docker image
# docker login cae-artifactory.jpl.nasa.gov:16003
# docker pull cae-artifactory.jpl.nasa.gov:16003/podaac/service/build-node-16:cae

export DOCKER_DEFAULT_PLATFORM=linux/amd64

DOCKER_IMAGE=cae-artifactory.jpl.nasa.gov:16003/podaac/service/build-node-16:cae

rm -rf node_modules
rm -rf dist && mkdir dist

docker run \
  --rm \
  -it --entrypoint bash \
  -p 3000:3000 \
  --volume "$(pwd):/repo" \
  -w /repo \
  "$DOCKER_IMAGE" \
  run_dev.sh
