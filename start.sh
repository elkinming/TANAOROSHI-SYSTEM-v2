#!/bin/sh
nginx -g 'daemon off;' &
sleep 2
nginx -s reload
