# Docker

The following scripts are available for working with Docker images and containers.

- `npm run docker:image` - Create the Docker image. Also run this script to update the image when the Dockerfile changes.
- `npm run docker:reimage` - Create the Docker image from scratch.
- `npm run docker:start` - Start the Docker container. Once the application is built, it can be found at http://localhost:3128
- `npm run docker:stop` - Stop the Docker container
- `npm run docker:restart` - Restart the Docker container
- `npm run docker:ci` -   Build WV and run the end-to-end tests using Firefox in a headless environment
- `npm run docker:shell` - Run an interactive shell inside the container.
- `npm run docker:shellwin` - Run an interactive shell inside the container (Windows using `winpty`).
