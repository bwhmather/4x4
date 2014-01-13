#!/usr/bin/sh

function build
{
    reset
    make
}

build
while true; do
    inotifywait --event CLOSE_WRITE --recursive ./;
    build;
done
