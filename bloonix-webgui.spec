Summary: Bloonix WebGUI
Name: bloonix-webgui
Version: 0.25
Release: 1%{dist}
License: Commercial
Group: Utilities/System
Distribution: RHEL and CentOS

Packager: Jonny Schulz <js@bloonix.de>
Vendor: Bloonix

BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root

Source0: http://download.bloonix.de/sources/%{name}-%{version}.tar.gz
Requires: bloonix-webgui-core
AutoReqProv: no

%description
This is the web application of Bloonix.

%define with_systemd 0
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
chmod 755 /srv/bloonix/webgui-%{version}
chown root:root /srv/bloonix/webgui-%{version} /srv/bloonix/webgui
/srv/bloonix/webgui/bin/fix-perms

if [ -x "/srv/bloonix/webgui/scripts/bloonix-webgui" ] ; then
%if %{?with_systemd}
systemctl condrestart bloonix-webgui.service
%else
/sbin/service bloonix-webgui condrestart &>/dev/null
%endif
fi

%clean
rm -rf %{buildroot}

%files
%dir %attr(0755, root, root) %{blxdir}
%dir %attr(0755, root, root) %{blxdir}/pkg
%{blxdir}/pkg/webgui.tar.gz
%dir %attr(0755, root, root) %{srvdir}

%changelog
* Sun Jan 20 2015 Jonny Schulz <js@bloonix.de> - 0.25-1
- Make it unpossible to delete user and group with id 1.
