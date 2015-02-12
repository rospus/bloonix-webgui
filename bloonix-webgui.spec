Summary: Bloonix WebGUI
Name: bloonix-webgui
Version: 0.28
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
%define srvdir /srv/bloonix/webgui

%prep
%setup -q -n %{name}-%{version}

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{srvdir}
cp -a bin %{buildroot}%{srvdir}/
cp -a ChangeLog %{buildroot}%{srvdir}/
cp -a lang %{buildroot}%{srvdir}/
cp -a lib %{buildroot}%{srvdir}/
cp -a LICENSE %{buildroot}%{srvdir}/
cp -a public %{buildroot}%{srvdir}/
cp -a schema %{buildroot}%{srvdir}/
cp -a scripts %{buildroot}%{srvdir}/
cp -a templates %{buildroot}%{srvdir}/

%pre
if [ -h "/srv/bloonix/webgui" ] ; then
    rm -f /srv/bloonix/webgui
fi

%post
/srv/bloonix/webgui/bin/fix-perms

%if %{?with_systemd}
systemctl condrestart bloonix-webgui.service
%else
/sbin/service bloonix-webgui condrestart &>/dev/null
%endif

%clean
rm -rf %{buildroot}

%files
%dir %attr(0755, root, root) %{srvdir}
%defattr (-, root, root)
%{srvdir}/*

%changelog
* Thu Feb 12 2015 Jonny Schulz <js@bloonix.de> - 0.28-1
- Fixed typo safe -> save.
- Fixed empty variable handling (agent_options).
* Mon Jan 26 2015 Jonny Schulz <js@bloonix.de> - 0.27-1
- Fixed <br/> in dependency table.
- Hide nav item "company" if the user is not an admin.
- Kicked parameter company_id for contact forms.
- Replaced the raw call /usr/sbin/sendmail with MIME::Lite.
* Tue Jan 20 2015 Jonny Schulz <js@bloonix.de> - 0.26-1
- Fix installation.
* Sun Jan 18 2015 Jonny Schulz <js@bloonix.de> - 0.25-1
- Make it unpossible to delete user and group with id 1.
