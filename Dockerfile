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
ENV NODE_VERSION=18.14.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install v${NODE_VERSION} && \
    nvm use v${NODE_VERSION} && \
    nvm alias default v${NODE_VERSION}

ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"

WORKDIR /build
# Only what is needed to run the development server and run the Selenium tests
RUN mkdir -p /build/node_modules && \
    npm install \
    chromedriver \
    express \
    geckodriver \
    selenium-server-standalone-jar \
    nightwatch

VOLUME /build/node_modules

EXPOSE 80
CMD  tail -f /dev/null
