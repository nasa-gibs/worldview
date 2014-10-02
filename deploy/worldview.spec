# Note: This does not do a "proper" build. It is assumed that the distribution
# package has already been made.

# Turn off the brp-python-bytecompile script
%global __os_install_post %(echo '%{__os_install_post}' | sed -e 's!/usr/lib[^[:space:]]*/brp-python-bytecompile[[:space:]].*$!!g')

Name:		@WORLDVIEW@
Version:	@BUILD_VERSION@
Release:	@BUILD_RELEASE@.@BUILD_NUMBER@%{?dist}
Summary:	Browse full-resolution, near real-time satellite imagery.

License:	Copyright NASA
URL:		http://earthdata.nasa.gov
Source0:	site-@WORLDVIEW@.tar.bz2
Source1:	site-@WORLDVIEW@-debug.tar.bz2
Source2:        worldview-config.tar.bz2
Source3:	httpd.conf
Source4:	httpd-debug.conf
#Source4:	events_log.conf
#Source4:	events_log-debug.conf
#Source5:	cron.worldview
#Source6:	cron.worldview-debug
#Source7:	logrotate.worldview
#Source8:	logrotate.worldview-debug

BuildArch:	noarch
Requires:	httpd
#Requires:	python-feedparser
#Requires:	python-beautifulsoup4
#Requires:	gdal
#Requires:	gdal-python

%description
In essence, Worldview shows the entire Earth as it looks "right now",
or at least as it has looked within the past few hours. Worldview
supports time-critical application areas such as wildfire management,
air quality measurements, and weather forecasting.

The imagery is generally available within three hours of observation
and can easily be compared to observations from the past - just click
or drag the time sliders at the bottom of the page. Imagery is
available from May 2012 onward and we are working to provide access to
earlier dates. Arctic and Antarctic polar stereographic views of
several products are also available for a "full globe" perspective.


%package debug
Summary:	Non-minified version of Worldview for debugging


%description debug
Non-minified version of	Worldview for debugging


%global httpdconfdir %{_sysconfdir}/httpd/conf.d

%prep
%setup -c -T
tar xf %{SOURCE0}
tar xf %{SOURCE1}
tar xf %{SOURCE2}
cp -r options/{brand,config} site-@WORLDVIEW@/web
cp -r options/{brand,config} site-@WORLDVIEW@-debug/web
cp %{SOURCE3} .
cp %{SOURCE4} .
#cp %{SOURCE4} .
#cp %{SOURCE5} .
#cp %{SOURCE6} .
#cp %{SOURCE7} .
#cp %{SOURCE8} .


%build


%install
rm -rf %{buildroot}

#chmod 755 @WORLDVIEW@/bin/*
#chmod 755 @WORLDVIEW@-debug/bin/*

# Apache configuration for release
install -m 755 -d %{buildroot}/%{httpdconfdir}
install -m 644 httpd.conf \
	%{buildroot}/%{httpdconfdir}/@WORLDVIEW@.conf
rm httpd.conf

# Apache configuration for debug
install -m 644 httpd-debug.conf \
	%{buildroot}/%{httpdconfdir}/@WORLDVIEW@-debug.conf
rm httpd-debug.conf

# Release application
install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@
cp -r site-@WORLDVIEW@/* %{buildroot}/%{_datadir}/@WORLDVIEW@

# Debug application
install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@-debug
cp -r site-@WORLDVIEW@-debug/* %{buildroot}/%{_datadir}/@WORLDVIEW@-debug

#install -m 755 -d %{buildroot}/%{_sysconfdir}/@WORLDVIEW@
#install -m 644 events_log.conf \
#	%{buildroot}/%{_sysconfdir}/@WORLDVIEW@/events_log.conf
#install -m 755 -d %{buildroot}/%{_sysconfdir}/@WORLDVIEW@-debug
#install -m 644 events_log-debug.conf \
#	%{buildroot}/%{_sysconfdir}/@WORLDVIEW@-debug/events_log-debug.conf

#install -m 755 -d %{buildroot}/%{_sharedstatedir}/@WORLDVIEW@
#install -m 755 -d %{buildroot}/%{_sharedstatedir}/@WORLDVIEW@-debug
#install -m 755 -d %{buildroot}/%{_localstatedir}/log/@WORLDVIEW@
#install -m 755 -d %{buildroot}/%{_localstatedir}/log/@WORLDVIEW@-debug

#install -m 755 -d %{buildroot}/%{_sysconfdir}/cron.d
#install -m 600 cron.worldview %{buildroot}/%{_sysconfdir}/cron.d/@WORLDVIEW@
#install -m 600 cron.worldview-debug %{buildroot}/%{_sysconfdir}/cron.d/@WORLDVIEW@-debug

#install -m 755 -d %{buildroot}/%{_sysconfdir}/logrotate.d
#install -m 600 logrotate.worldview \
#	%{buildroot}/%{_sysconfdir}/logrotate.d/@WORLDVIEW@
#install -m 600 logrotate.worldview-debug \
#	%{buildroot}/%{_sysconfdir}/logrotate.d/@WORLDVIEW@-debug


%clean
rm -rf %{buildroot}


%files
%defattr(-,root,root,-)
%{_datadir}/@WORLDVIEW@
%config(noreplace) %{httpdconfdir}/@WORLDVIEW@.conf
#%config(noreplace) %{_sysconfdir}/@WORLDVIEW@/events_log.conf
#%config(noreplace) %{_sysconfdir}/cron.d/@WORLDVIEW@
#%config(noreplace) %{_sysconfdir}/logrotate.d/@WORLDVIEW@

#%defattr(600,apache,apache,700)
#%dir %{_sharedstatedir}/@WORLDVIEW@
#%dir %{_localstatedir}/log/@WORLDVIEW@


%files debug
%{_datadir}/@WORLDVIEW@-debug
%config(noreplace) %{httpdconfdir}/@WORLDVIEW@-debug.conf
#%config(noreplace) %{_sysconfdir}/@WORLDVIEW@-debug/events_log-debug.conf
#%config(noreplace) %{_sysconfdir}/cron.d/@WORLDVIEW@-debug
#%config(noreplace) %{_sysconfdir}/logrotate.d/@WORLDVIEW@-debug

#%defattr(600,apache,apache,700)
#%dir %{_sharedstatedir}/@WORLDVIEW@-debug
#%dir %{_localstatedir}/log/@WORLDVIEW@-debug


%post
if [ $1 -gt 0 ] ; then
   if /sbin/service httpd status >/dev/null ; then
      /sbin/service httpd reload
   fi
fi

%post debug
if [ $1 -gt 0 ] ; then
   if /sbin/service httpd status >/dev/null ; then
       /sbin/service httpd reload
   fi
fi

%postun
if [ $1 -eq 0 ] ; then
   if /sbin/service httpd status >/dev/null ; then
       /sbin/service httpd reload
   fi
fi

%postun debug
if [ $1 -eq 0 ] ; then
   if /sbin/service httpd status >/dev/null ; then
       /sbin/service httpd reload
   fi
fi


%changelog
* Wed Oct 30 2013 Mike McGann <mike.mcgann@nasa.gov> - 0.6.0-1
- Worldview 0.6.0 release

* Thu May 9 2013 Mike McGann <mike.mcgann@nasa.gov> - 0.4.5-1
- Initial package
