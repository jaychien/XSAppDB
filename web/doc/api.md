#### [/api/getlibrary/**n**](/api/getlibrary/1) ####

取得程式檔案資料. API回傳binary bytes.

* n = 1 => xsb檔案(腳本)
* n = 2 => dsr檔案(進階警示)

#### [/api/getschedule/**n**](/api/getschedule/1) ####

取得某台機器的排程資料. API回傳binary bytes (as XSSchedule.db格式).
**n** 為主機的編號, 從1開始.
