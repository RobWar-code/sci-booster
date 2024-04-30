#!/bin/bash
# Update the local host with modified files in this directory
rsync -av --update ./src/ /var/www/html/sci-booster/src/