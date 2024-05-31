#!/bin/bash
# Update the USB backup with modified files in this sci-booster directory
rsync -av --update ./ /media/robs/USB2/pluto/Projects/narayana02/sci-booster
