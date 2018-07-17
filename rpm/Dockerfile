FROM centos:6

RUN yum install -y epel-release && \
    yum install -y https://centos6.iuscommunity.org/ius-release.rpm && \
    yum install -y \
        "@Development Tools" \
        python27 \
        python27-virtualenv \
        git \
        stow \
        xz

RUN mkdir -p /usr/local/stow
RUN cd /usr/local/stow && \
    curl -O https://nodejs.org/dist/v8.11.2/node-v8.11.2-linux-x64.tar.xz && \
    tar xf node-v8.11.2-linux-x64.tar.xz && \
    rm -f /usr/local/stow/node/node-v8.11.2-linux-x64.tar.xz && \
    rm -f /usr/local/stow/node-v8.11.2-linux-x64/{LICENSE,*.md} && \
    stow -S node-v8.11.2-linux-x64

RUN npm install run-script-os -g

RUN ln -s /usr/bin/virtualenv-2.7 /usr/bin/virtualenv
