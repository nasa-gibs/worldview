# Note: This does not do a "proper" build. It is assumed that the distribution
# package has already been made.

Name:		@WORLDVIEW@
Version:	@BUILD_VERSION@
Release:	@BUILD_RELEASE@%{?build_num}@GIT_REVISION@%{?dist}
Summary:	Browse full-resolution, near real-time satellite imagery.

License:	Copyright NASA
URL:		http://earthdata.nasa.gov
Source0:	worldview.tar.gz
Source1:	worldview-debug.tar.gz
Source2:	httpd.worldview.conf
Source3:	httpd.worldview-debug.conf
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
Requires:	%{name} = %{version}-%{release}


%description debug
Non-minified version of	Worldview for debugging


%global httpdconfdir %{_sysconfdir}/httpd/conf.d

%prep
%setup -c -T
tar xf %{SOURCE0}
tar xf %{SOURCE1}
cp %{SOURCE2} .
cp %{SOURCE3} .
#cp %{SOURCE4} .
#cp %{SOURCE5} .
#p %{SOURCE6} .
#p %{SOURCE7} .
#p %{SOURCE8} .


%build


%install
rm -rf %{buildroot}
install -m 755 -d %{buildroot}/%{httpdconfdir}
install -m 644 httpd.worldview.conf \
	%{buildroot}/%{httpdconfdir}/@WORLDVIEW@.conf
rm httpd.worldview.conf
install -m 644 httpd.worldview-debug.conf \
	%{buildroot}/%{httpdconfdir}/@WORLDVIEW@-debug.conf
rm httpd.worldview-debug.conf 

install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@
cp -r worldview/* %{buildroot}/%{_datadir}/@WORLDVIEW@
install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@-debug
cp -r worldview-debug/* %{buildroot}/%{_datadir}/@WORLDVIEW@-debug

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
#%dir %{_sysconfdir}/worldview
#%config(noreplace) %{_sysconfdir}/@WORLDVIEW@/events_log.conf
#%config(noreplace) %{_sysconfdir}/cron.d/@WORLDVIEW@
#%config(noreplace) %{_sysconfdir}/logrotate.d/@WORLDVIEW@

#%defattr(600,apache,apache,700)
#%dir %{_sharedstatedir}/@WORLDVIEW@
#%dir %{_localstatedir}/log/@WORLDVIEW@


%files debug
%{_datadir}/@WORLDVIEW@-debug
%config(noreplace) %{httpdconfdir}/@WORLDVIEW@-debug.conf
#%dir %{_sysconfdir}/@WORLDVIEW@-debug
#%config(noreplace) %{_sysconfdir}/@WORLDVIEW@-debug/events_log-debug.conf
#%config(noreplace) %{_sysconfdir}/cron.d/@WORLDVIEW@-debug
#%config(noreplace) %{_sysconfdir}/logrotate.d/@WORLDVIEW@-debug

#%defattr(600,apache,apache,700)
#%dir %{_sharedstatedir}/@WORLDVIEW@-debug
#%dir %{_localstatedir}/log/@WORLDVIEW@-debug


%post
if [ $1 -gt 1 ] ; then
   service httpd reload
fi

%post debug
if [ $1 -gt 1 ] ; then
   service httpd reload
fi

%postun
if [ $1 -eq 0 ] ; then
   serivce httpd reload
fi

%postun debug
if [ $1 -eq 0 ] ; then
   serivce httpd reload
fi


%changelog
* Wed Oct 30 2013 Mike McGann <mike.mcgann@nasa.gov> - 0.6.0-1
- Worldview 0.6.0 release

* Thu May 9 2013 Mike McGann <mike.mcgann@nasa.gov> - 0.4.5-1 
- Initial package
