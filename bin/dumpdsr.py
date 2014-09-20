#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Usage: dumpdsr <DSR filename>
output the following data
<ID>,<Name>,<FolderName>
"""

import sys
from OleFileIO_PL import OleFileIO_PL
from bs4 import BeautifulSoup

filename = sys.argv[1]
ole = OleFileIO_PL.OleFileIO(filename)

"""
listdir = ole.listdir()
streams = []
for direntry in listdir:
    streams.append('/'.join(direntry))
print 'Streams=', streams
"""

# read "FileContentFileText_0"
#
xmlstring = ole.openstream("FileContentFileText_0").getvalue().decode('big5')
xml = BeautifulSoup(xmlstring)
for l in xml.find_all('list'):
	print (l['id'] + ',' + l['name'] + ',' + l['classifyfolder']).encode('utf-8')

ole.close()


