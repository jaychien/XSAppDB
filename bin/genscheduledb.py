#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
Usage:
# python genscheduledb.py <JSONFileName> <SQLiteFileName>

<JSONFileName> is a json file, with the following content
[
   { "name": .., "guid": .., "runType": .., "status": .., "startTime": .., "endTime": .., "createDate": ..},
   { .. }
]

this program will read the content in JSON file, and create the corresponding sqlite file, with 'name'
converted to big5.
"""

import sqlite3
import sys
import json

with open(sys.argv[1]) as json_file:
    scheduleList = json.load(json_file)

db = sqlite3.connect(sys.argv[2])
db.text_factory = str

with db:
    cur = db.cursor()

    cur.execute("DROP TABLE IF EXISTS XSSchedule01")
    cur.execute("CREATE TABLE XSSchedule01 ([XQSensorName] TEXT, [XQSensorID] TEXT, [SensorRunType] INTEGER, [Status] INTEGER, [StartTime] TEXT, [EndTime] TEXT, [CreateTime] TEXT, [Priority] INTEGER)")

    for schedule in scheduleList:
        cur.execute(
            "INSERT INTO XSSchedule01 Values (?, ?, ?, ?, ?, ?, ?, ?)",
            (schedule['name'].encode('big5'), schedule['guid'], schedule['runType'], schedule['status'], schedule['startTime'], schedule['endTime'],schedule['createDate'],schedule['priority'])
        )

db.close()
