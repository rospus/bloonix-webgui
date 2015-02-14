#!/bin/bash

if test `id -u` -ne 0 ; then
    echo "Please execute this script as user root"
    exit 1
fi

echo
echo -n "Please enter the password for the database user 'bloonix': "
read -s password
echo
echo
echo "Create user 'bloonix'"
echo

su - postgres -c "
psql -c \"CREATE ROLE bloonix WITH LOGIN PASSWORD '$password';\"
psql -c \"CREATE DATABASE bloonix OWNER bloonix;\"
"

echo
echo "Install bloonix schema"
echo

PGPASSWORD="$password" psql -U bloonix -h localhost -f /srv/bloonix/webgui/schema/schema-pg.sql
sed -i "s/$password/@@PASSWORD@@/" /etc/bloonix/database/main.conf

echo

