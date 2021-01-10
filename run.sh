#!/bin/sh
rm nohup.out
nohup node server.js&
echo "$(ps -ef | grep "[0-9] node server.js")"
exit 0
