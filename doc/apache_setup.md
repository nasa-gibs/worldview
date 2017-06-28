# Worldview installation using Apache

Download and install [Node.js](http://nodejs.org/) using the instructions on
their site.

Clone this repository:

```bash
git clone https://github.com/nasa-gibs/worldview.git
cd worldview
```

Select one of the following configuration repositories:

```bash
# Official EOSDIS configurations
git clone https://github.com/nasa-gibs/worldview-options-eosdis.git options

# Or a blank repository with only Corrected Reflectance and no branding
git clone https://github.com/nasa-gibs/worldview-options-template.git options
```

Now install a global version of [grunt](http://gruntjs.com/) using the
following command:

```bash
sudo npm install --global grunt-cli
```

Install the packages required for building:

```bash
npm install
```

Some python libraries are required. Install virtualenv to keep additional
libraries installed in a local directory:

```bash
sudo easy_install virtualenv==1.10.1
```

Start the build with:

```bash
grunt
```

The ``dist`` directory now contains ``site`` tar files that can be
can be uploaded and unpacked to a web server.

## Mac OS X
### Apache Server Configuration
*These instructions work with OS X El Capitan. Directories and steps may differ with other OS X versions*

Open httpd.conf
```bash
sudo vi /etc/apache2/httpd.conf
```
Make sure the following modules are enabled:
```bash
LoadModule expires_module libexec/mod_expires.so
LoadModule php5_module modules/libphp5.so
LoadModule deflate_module libexec/apache2/mod_deflate.so
```
For data download to function, CGI scripts must be executable. To do that, enable the mod_cgid module in the httpd.conf file.
```bash
LoadModule cgid_module modules/mod_cgid.so
```

### Example Apache User Configuration
To access apache user config:
```bash
sudo vi /etc/apache2/users/Your-User-Name.conf
```
```bash
Adjust the configuration:
<Directory "/Users/Your-User-Name/Some-Dir">
    AllowOverride All
    Options Indexes MultiViews FollowSymLinks Includes ExecCGI
    Require all granted
</Directory>
```
Restart Apache:
```bash
sudo apachectl restart
```

## Windows
### Settings for a Worldview development environment
Worldview may be setup on Windows with XAMPP. First install XAMPP, the default location is at C:\xampp. Clone the Worldview repo at C:\xampp\htdocs and then the configuration repo in Worldview.

Edit the httpd.conf file at &lt;xampp root&gt;\apache\conf to uncomment:

```bash
"LoadModule expires_module modules/mod_expires.so" 
"LoadModule filter_module modules/mod_filter.so"
"LoadModule deflate_module modules/mod_deflate.so"
```

Turn on xampp, and Worldview should be ready at "localhost/worldview/web"! If you encounter any code 500 errors, check the error log at &lt;xampp root&gt;\apache\logs

## Troubleshooting
If the steps above were not enough to get your environment set up, don't give up
* Open apache logs to see if any obvious errors are being thrown
* Open the console of your web browser to see if any recognizable errors are present
