FROM centos:7

RUN yum install -y epel-release && \
    yum install -y https://centos7.iuscommunity.org/ius-release.rpm && \
    yum install -y \
    "@Development Tools" \
    cairo-devel \
    firefox \
    giflib-devel \
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
RUN cd /usr/src && \
    wget https://www.python.org/ftp/python/3.7.4/Python-3.7.4.tgz  && \
    tar xzf Python-3.7.4.tgz && \
    rm Python-3.7.4.tgz && \
    cd Python-3.7.4 && \
    ./configure --enable-optimizations && \
    make altinstall && \
    ln -sf /usr/local/bin/python3.7 /usr/local/bin/python3 && \
    python3 -V && \
    curl -O https://bootstrap.pypa.io/get-pip.py && \
    python3 get-pip.py && \
    python3 -m ensurepip && \
    pip install virtualenv && \
    pip --version
RUN mkdir -p /usr/local/stow
RUN cd /usr/local/stow && \
    curl -O https://nodejs.org/download/release/v10.19.0/node-v10.19.0-linux-x64.tar.xz && \
    tar xf node-v10.19.0-linux-x64.tar.xz && \
    rm -f /usr/local/stow/node/node-v10.19.0-linux-x64.tar.xz && \
    rm -f /usr/local/stow/node-v10.19.0-linux-x64/{LICENSE,*.md} && \
    stow -S node-v10.19.0-linux-x64
RUN ln -s /usr/bin/virtualenv-3.7.4 /usr/bin/virtualenv

WORKDIR /build
# Only what is needed to run the development server and run the Selenium tests
RUN mkdir -p /build/node_modules && \
    npm --unsafe-perm install \
    chromedriver \
    express \
    geckodriver \
    selenium-server-standalone-jar \
    nightwatch

VOLUME /build/node_modules
VOLUME /build/.python

EXPOSE 80
CMD tail -f /dev/null


