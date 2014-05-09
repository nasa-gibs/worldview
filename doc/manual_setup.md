# Manual Setup

Download and install [Node.js](http://nodejs.org/) using the intructions on
their site.

Now install a global version of [grunt](http://gruntjs.com/) using the
following command:

    sudo npm install --global grunt-cli

Clone a copy of the Worldview repository and change to the ``worldview`` directory.
Now install the packages required for building:

    npm install

Some python libraries are required. Install virtualenv to keep additional
libraries installed in a local directory:

    sudo easy_install virtualenv==1.10.1

Setup a virtualenv and install dependencies:

    virtualenv python
    python/bin/pip install xmltodict

Clone a copy of the generic branding and configuration option set:

    git clone https://github.com/nasa-gibs/worldview-options-template.git options

The default option set only contains three layers. If you would like to
use the same configuration as the main Worldview application, clone that
option set and copy out the necessary configurations:

    mkdir -p build
    git clone https://github.com/nasa-gibs/worldview-options-eosdis.git build/options-eosdis
    cp -r build/options-eosds/{config,colormaps,config.json} options

Start the build with:

    grunt

The ``dist`` directory now contains a ``example-map.tar.bz2`` file which
can be uploaded and unpacked to a web server.

On OS X, to run Worldview on your local machine using apache, generate
the configuration with:

    grunt apache-config

Now copy the file to the apache configuration directory:

    sudo cp dist/example-map-dev.httpd.conf /etc/apache2/other

Restart apache:

    sudo apachectl restart

Worldview should now be available at the following:

* [http://localhost/example-map](http://localhost/example-map): Uses the source
directory
* [http://localhost/example-map-debug](http://localhost/example-map-debug):
Uses the debug version (non-minified versions) found in the build directory.
* [http://localhost/example-map-release](http://localhost/example-map-release):
Uses the release version (minified versions) found in the build directory.
