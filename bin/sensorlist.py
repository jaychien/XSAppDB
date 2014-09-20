#!/usr/bin/python
# -*- coding: utf-8 -*-

import sqlite3 as lite
import sys
import json

conn = lite.connect(sys.argv[1])
conn.text_factory = str
folderMap = {};
with conn:    

    cur = conn.cursor()
    cur.execute("SELECT ID,Folder,Parent FROM FolderClassify")
    rows = cur.fetchall()
    for row in rows:
    	folder = { 'ID':row[0], 'Folder':row[1].decode('big5'), 'Parent':row[2].decode('big5')}
    	folderMap[folder['ID']] = folder;

    cur = conn.cursor()    
    cur.execute("SELECT ID,Name,ClassifyFolderID FROM SensorList")
    rows = cur.fetchall()
    for row in rows:
    	folderID = row[2]
    	folderName = ''
    	if folderID <> '':
    		folderName = folderMap[folderID]['Folder']
    	
        line = row[0] + ',' + row[1].decode('big5') + ',' + folderName
        print line.encode('utf-8')


