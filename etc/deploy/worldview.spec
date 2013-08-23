# Note: This does not do a "proper" build. It is assumed that the distribution
# package has already been made.

Name:		worldview
Version:	0.6.0
Release:	0.1%{?dist}
Summary:	Browse full-resolution, near real-time satellite imagery.

License:	Copyright NASA
URL:		http://earthdata.nasa.gov
Source0:	worldview.tar.bz2
Source1:	worldview-debug.tar.bz2
Source2:	httpd.worldview.conf
Source3:	httpd.worldview-debug.conf
Source4:	events_log.conf
Source5:	cron.worldview
Source6:	logrotate.worldview

BuildArch:	noarch
Requires:	httpd
Requires:	php
Requires:	python-feedparser
Requires:	python-beautifulsoup4
Requires:	gdal
Requires:	gdal-python

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
cp %{SOURCE4} .
cp %{SOURCE5} .
cp %{SOURCE6} .


%build


%install
rm -rf %{buildroot}
install -m 755 -d %{buildroot}/%{httpdconfdir}
install -m 644 httpd.worldview.conf \
	%{buildroot}/%{httpdconfdir}/worldview.conf
rm httpd.worldview.conf
install -m 644 httpd.worldview-debug.conf \
	%{buildroot}/%{httpdconfdir}/worldview-debug.conf
rm httpd.worldview-debug.conf 

install -m 755 -d %{buildroot}/%{_datadir}/worldview
cp -r worldview/* %{buildroot}/%{_datadir}/worldview
install -m 755 -d %{buildroot}/%{_datadir}/worldview-debug
cp -r worldview/* %{buildroot}/%{_datadir}/worldview-debug

install -m 755 -d %{buildroot}/%{_sysconfdir}/worldview
install -m 644 events_log.conf \
	%{buildroot}/%{_sysconfdir}/worldview/events_log.conf

install -m 755 -d %{buildroot}/%{_sharedstatedir}/worldview
install -m 755 -d %{buildroot}/%{_localstatedir}/log/worldview

install -m 755 -d %{buildroot}/%{_sysconfdir}/cron.d
install -m 600 cron.worldview %{buildroot}/%{_sysconfdir}/cron.d/worldview

install -m 755 -d %{buildroot}/%{_sysconfdir}/logrotate.d
install -m 600 logrotate.worldview \
	%{buildroot}/%{_sysconfdir}/logrotate.d/worldview


%clean
rm -rf %{buildroot}


%files
%defattr(-,root,root,-)
%{_datadir}/worldview
%config(noreplace) %{httpdconfdir}/worldview.conf
%dir %{_sysconfdir}/worldview
%config(noreplace) %{_sysconfdir}/worldview/events_log.conf
%config(noreplace) %{_sysconfdir}/cron.d/worldview
%config(noreplace) %{_sysconfdir}/logrotate.d/worldview

%defattr(600,apache,apache,700)
%dir %{_sharedstatedir}/worldview
%dir %{_localstatedir}/log/worldview


%files debug
%{_datadir}/worldview-debug
%config %{httpdconfdir}/worldview-debug.conf


%changelog
* Wed Aug 21 2013 Mike McGann <mike.mcgann@nasa.gov> - 0.6.0-0.1
- Restructured for events

* Thu May 9 2013 Mike McGann <mike.mcgann@nasa.gov> - 0.4.5-1 
- Initial package
