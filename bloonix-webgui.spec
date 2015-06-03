Summary: Bloonix WebGUI
Name: bloonix-webgui
Version: 0.48
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
* Mon Jun 01 2015 Jonny Schulz <js@bloonix.de> - 0.48-1
- Default font-weight set to normal.
* Mon Jun 01 2015 Jonny Schulz <js@bloonix.de> - 0.47-1
- Implemented a small workaround for a bug in check-by-satellite
  of bloonix-plugins-basic 0.37.
- Created a new style.
- Changed the default font to "Open Sans" and added a info to
  the license file.
* Thu May 14 2015 Jonny Schulz <js@bloonix.de> - 0.46-1
- Fixed/added transactions support for mysql.
* Thu May 14 2015 Jonny Schulz <js@bloonix.de> - 0.45-1
- Quick fix for init-database.
* Thu May 07 2015 Jonny Schulz <js@bloonix.de> - 0.44-1
- Added support for MySQL.
- Sort thresholds in service form.
* Thu Apr 23 2015 Jonny Schulz <js@bloonix.de> - 0.43-1
- Improved service parameter parsing.
* Mon Apr 20 2015 Jonny Schulz <js@bloonix.de> - 0.42-1
- Fixed bug: drop column country_code only if the column exist - 2.
* Mon Apr 20 2015 Jonny Schulz <js@bloonix.de> - 0.41-1
- Fixed bug: drop column country_code only if the column exist.
* Sun Apr 19 2015 Jonny Schulz <js@bloonix.de> - 0.40-1
- Fixed bug: if a template is added to a host then max_services=0 is not
  treated as unlimited.
* Sun Apr 19 2015 Jonny Schulz <js@bloonix.de> - 0.39-1
- Kicked parameter show_locations and make the location feature available.
* Fri Apr 17 2015 Jonny Schulz <js@bloonix.de> - 0.38-1
- Fixed version number handling in database maintenance.
* Thu Apr 16 2015 Jonny Schulz <js@bloonix.de> - 0.37-1
- Bloonix Satellite implemented.
* Sun Apr 05 2015 Jonny Schulz <js@bloonix.de> - 0.36-1
- Limits implemented.
* Fri Mar 13 2015 Jonny Schulz <js@bloonix.de> - 0.35-1
- Fixed column creation for the service table.
* Wed Mar 11 2015 Jonny Schulz <js@bloonix.de> - 0.34-1
- Added column data_retention to table host.
* Tue Mar 10 2015 Jonny Schulz <js@bloonix.de> - 0.33-1
- Modified ES template and force object some keys to type 'string'.
- Fixed building of location option for templates.
- Show the inherited time values for timeouts and intervals for services.
- Moved the submit button to create user charts into the overlay footer.
- Added column volatile_comment to table service.
- Now all actions (acknowlegded, notification, active, volatile) will be logged.
* Mon Feb 16 2015 Jonny Schulz <js@bloonix.de> - 0.32-1
- Improved the database upgrade.
- Migrate dashboard width from 9 to 12 and height from 6 to 12.
- Changed the order of dashlet icons and fixed the initial dashlet
  width and height
- Pattern fixed in init-database.
* Sun Feb 15 2015 Jonny Schulz <js@bloonix.de> - 0.31-1
- Fixed quoting of init-database.
* Sat Feb 14 2015 Jonny Schulz <js@bloonix.de> - 0.30-1
- Scale dashlets on the dashboard to a value related to the content width.
- Init-database now replaces the pattern @@PASSWORD@@ in the configuration.
* Thu Feb 12 2015 Jonny Schulz <js@bloonix.de> - 0.29-1
- New feature: doWaitForElement can now wait for text within an element too.
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
