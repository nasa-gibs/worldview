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
        python27 \
        python2-pip \
        python27-virtualenv \
        git \
        stow \
        which \
        xorg-x11-server-Xvfb \
        xz

RUN mkdir -p /usr/local/stow
RUN cd /usr/local/stow && \
    curl -O https://nodejs.org/dist/v8.11.2/node-v8.11.2-linux-x64.tar.xz && \
    tar xf node-v8.11.2-linux-x64.tar.xz && \
    rm -f /usr/local/stow/node/node-v8.11.2-linux-x64.tar.xz && \
    rm -f /usr/local/stow/node-v8.11.2-linux-x64/{LICENSE,*.md} && \
    stow -S node-v8.11.2-linux-x64
RUN ln -s /usr/bin/virtualenv-2.7 /usr/bin/virtualenv

WORKDIR /build
RUN mkdir -p /build/node_modules
# Only what is needed to run the development server and run the Selenium tests
RUN npm --unsafe-perm install \
    chromedriver \
    express \
    geckodriver \
    selenium-server-standalone-jar \
    nightwatch

VOLUME /build/node_modules
VOLUME /build/.python

EXPOSE 80
CMD npm start >/var/log/worldview.log 2>&1


