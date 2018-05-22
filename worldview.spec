Name: @WORLDVIEW@
Version: @BUILD_VERSION@
Release: 1.@BUILD_NUMBER@%{?dist}
Summary: Browse full-resolution, near real-time satellite imagery.
License: NASA-1.3
URL: http://earthdata.nasa.gov
Source0: site-@WORLDVIEW@.tar.bz2
Source1: site-@WORLDVIEW@-debug.tar.bz2
Source3: httpd.conf
Source4: httpd-debug.conf
BuildArch: noarch
Requires: httpd

# Turn off the brp-python-bytecompile script
%global __os_install_post %(echo '%{__os_install_post}' | sed -e 's!/usr/lib[^[:space:]]*/brp-python-bytecompile[[:space:]].*$!!g')

# Set httpd configuration
%global httpdconfdir %{_sysconfdir}/httpd/conf.d

%description
%{summary}

%package debug
Summary:	Non-minified version of Worldview for debugging

%description debug
%{summary}

%prep
%setup -c -T
tar xf %{SOURCE0}
tar xf %{SOURCE1}
cp %{SOURCE3} .
cp %{SOURCE4} .

%install
rm -rf %{buildroot}

# Install Apache configuration for release
install -m 755 -d %{buildroot}/%{httpdconfdir}
install -m 644 httpd.conf %{buildroot}/%{httpdconfdir}/@WORLDVIEW@.conf
rm httpd.conf

# Install Apache configuration for debug
install -m 644 httpd-debug.conf %{buildroot}/%{httpdconfdir}/@WORLDVIEW@-debug.conf
rm httpd-debug.conf

# Install release application
install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@
cp -r site-@WORLDVIEW@/* %{buildroot}/%{_datadir}/@WORLDVIEW@

# Install debug application
install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@-debug
cp -r site-@WORLDVIEW@-debug/* %{buildroot}/%{_datadir}/@WORLDVIEW@-debug

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_datadir}/@WORLDVIEW@
%config(noreplace) %{httpdconfdir}/@WORLDVIEW@.conf


%files debug
%{_datadir}/@WORLDVIEW@-debug
%config(noreplace) %{httpdconfdir}/@WORLDVIEW@-debug.conf

%post
if [ $1 -gt 0 ] ; then
   if /bin/systemctl show httpd.service | grep ActiveState=active >/dev/null ; then
      /bin/systemctl reload httpd.service
   fi
fi

%post debug
if [ $1 -gt 0 ] ; then
   if /bin/systemctl show httpd.service | grep ActiveState=active >/dev/null ; then
      /bin/systemctl reload httpd.service
   fi
fi

%postun
if [ $1 -gt 0 ] ; then
   if /bin/systemctl show httpd.service | grep ActiveState=active >/dev/null ; then
      /bin/systemctl reload httpd.service
   fi
fi

%postun debug
if [ $1 -gt 0 ] ; then
   if /bin/systemctl show httpd.service | grep ActiveState=active >/dev/null ; then
      /bin/systemctl reload httpd.service
   fi
fi

