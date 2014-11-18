-------------------------------------------
Site update
-------------------------------------------


-------------------------------------------
- 顯示觸發紀錄
-------------------------------------------

source: 
- ftp://ss-xsdecoder01, sysjust/sysjust
	/XMLFiles/yyyyMMdd/SensorTrigger.txt
					  /SensorTrigger.xml


- txt檔案為 big5格式

040F575D-A31B-4573-990C-D846F7498019,主力默默收集籌碼後攻堅,20141118-90021,2402.TW,33.450000,223.000000,2.000000,0.350000,0.010574,33.100000,33.400000,33.450000,223.000000,,30.800000,,多方

	- GUID
	- Name
	- 時間 (note:時間部分有可能只有5碼@@)
	- 商品
	- Price
	- TotalVol
	- Vol
	- 漲跌
	- 漲跌幅
	- PreClose
	- Bid
	- Ask
	- CurrentK_Vol
	- UpLimit
	- DownLimit
	- Msg
	- BSType

- 處理方式
	- 每日定時執行轉檔程式, 把當日的檔案轉入DB內
		// 提供一支程式可以轉入某一日的檔案 (OK : bin/importtrigger.js)

	- 存到MongoDB, DB=XSAppDB, Collection=TriggerRecords
		{ guid:"..", "triggerDate":.., "symbol":"..", "price":".."}







