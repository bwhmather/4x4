#!/usr/bin/env python

from subprocess import call
from sys import argv
from os.path import abspath

# encode + decode required for python 3
# TODO make sure that scheme escapes in the same way as c
infile = abspath(argv[1]).encode('unicode_escape').decode('utf-8')
outfile = abspath(argv[2]).encode('unicode_escape').decode('utf-8')

script = """
(define infile "{infile}")
(define outfile "{outfile}")

(define image (car (gimp-file-load 1 infile infile)))
(define drawable (car (gimp-image-flatten image)))

(file-png-save-defaults 1 image drawable outfile outfile)

(gimp-quit 0)
""".format(infile=infile, outfile=outfile)

call(['gimp', '--no-interface', '--no-data', '--no-fonts',
      '--batch', script], shell=False)
