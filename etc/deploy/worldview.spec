# Note: This does not do a "proper" build. It is assumed that the distribution
# package has already been made.

Name:		worldview
Version:	0.4.5
Release:	1%{?dist}
Summary:	Browse full-resolution, near real-time satellite imagery.

License:	Copyright NASA
URL:		http://earthdata.nasa.gov
Source0:	worldview.tar.bz2
Source1:	worldview-debug.tar.bz2
Source2:	httpd.worldview.conf
Source3:	httpd.worldview-debug.conf

BuildArch:	noarch
Requires:	httpd
Requires:	php

%description
In essence, Worldview* shows the entire Earth as it looks "right now",
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
Requires:	httpd
Requires:	php

%description debug
Non-minified version of	Worldview for debugging


%global httpdconfdir %{_sysconfdir}/httpd/conf.d

%prep
tar xf %{SOURCE0}
tar xf %{SOURCE1}
cp %{SOURCE2} .
cp %{SOURCE3} .


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


%clean
rm -rf %{buildroot}


%files
%defattr(-,root,root,-)
%{_datadir}/worldview
%config %{httpdconfdir}/worldview.conf


%files debug
%{_datadir}/worldview-debug
%config %{httpdconfdir}/worldview-debug.conf


%post
if [ "$1" == 1 ] ; then
   service httpd reload
fi

%post debug
if [ "$1" == 1 ] ; then
   service httpd reload
fi

%postun
if [ "$1" == 0 ] ; then
   service httpd reload
fi

%postun debug
if [ "$1" == 0 ] ; then
   service httpd reload
fi


%changelog
* Thu May 9 2012 Mike McGann <mike.mcgann@nasa.gov> - 0.4.5-1 
- Initial package
