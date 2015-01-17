Summary: Bloonix WebGUI
Name: bloonix-webgui
Version: 0.24
Release: 1%{dist}
License: Commercial
Group: Utilities/System
Distribution: RHEL and CentOS

Packager: Jonny Schulz <js@bloonix.de>
Vendor: Bloonix

BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root

Source0: http://download.bloonix.de/sources/%{name}-%{version}.tar.gz
Requires: bloonix-webgui
AutoReqProv: no

%description
This is the web application of Bloonix.

%define blxdir /usr/lib/bloonix
%define srvdir /srv/bloonix

%prep
%setup -q -n %{name}-%{version}

%install
rm -rf %{buildroot}
mkdir -p ${RPM_BUILD_ROOT}%{srvdir}
mkdir -p ${RPM_BUILD_ROOT}%{blxdir}/pkg
install -c -m 0444 webgui.tar.gz ${RPM_BUILD_ROOT}%{blxdir}/pkg/

%post
cd %{srvdir}
tar -xzf %{blxdir}/pkg/webgui.tar.gz
ln -sfn /srv/bloonix/webgui-%{version} /srv/bloonix/webgui

%clean
rm -rf %{buildroot}

%files
%dir %attr(0755, root, root) %{blxdir}
%dir %attr(0755, root, root) %{blxdir}/pkg
%dir %attr(0755, root, root) %{srvdir}

%changelog
* Tue Jan 13 2015 Jonny Schulz <js@bloonix.de> - 0.24-1
- Make it unpossible to delete user and group with id 1.
