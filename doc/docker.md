# Docker

The following scripts are available for working with docker images and containers.

- `npm run docker:image` - Create the docker image. Also run this script to update the image when the Dockerfile changes.
- `npm run docker:reimage` - Create the docker image from scratch.
- `npm run docker:start` - Start the docker container. Once the application is built, it can be found at http://localhost:3128
- `npm run docker:stop` - Stop the docker container
- `npm run docker:restart` - Restart the docker container
- `npm run docker:e2e` - Run the end-to-end tests using Firefox in a headless environment
- `npm run docker:shell` - Run an interactive shell inside the container.
-