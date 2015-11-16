#!/bin/bash

curl -H 'Content-Type: application/json' 'https://gui.bloonix.de/register/host?pretty' -d '{
    "company_id": 1,
    "company_authkey": "secret",
    "hostname": "test.bloonix.de",
    "ipaddr": "127.0.0.1"
}'
