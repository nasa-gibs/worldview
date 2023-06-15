FROM almalinux:9.1

RUN dnf install -y epel-release && \
    dnf --enablerepo=crb install giflib-devel -y && \
    dnf install -y \
    "@Development Tools" \
    cairo-devel \
    firefox \
    httpd \
    libjpeg-turbo-devel \
    java-1.8.0-openjdk \
    git \
    stow \
    which \
    xorg-x11-server-Xvfb \
    wget \
    libffi-devel \
    openssl-devel \
    xz
RUN mkdir -p /usr/local/nvm
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=18.16.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install v${NODE_VERSION} && \
    nvm use v${NODE_VERSION} && \
    nvm alias default v${NODE_VERSION}

ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"

FROM mcr.microsoft.com/playwright:focal

WORKDIR /build

RUN mkdir -p /build/node_modules && \
    npm install \
    @playwright/test \
    playwright-firefox

EXPOSE 80
CMD  tail -f /dev/null
