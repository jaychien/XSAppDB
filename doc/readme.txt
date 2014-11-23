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

- 顯示方式
	- 每個策略上面顯示最近N日(N=7)觸發的訊號次數
	- 點入後可以顯示最近一個月的訊號明細 & 簡單的統計(以後可以改成page-based)
	- 明細顯示方式
		- 日期, 時間, 商品, 價位, 當日賺賠, 5日後賺賠, 10日後賺賠


===================
TODO
===================
- 提供轉檔的api (從ftp server抓資料轉入mongodb)
- 提供排程 (寫在node app裡面)
- 提供轉檔的畫面
	- 選擇日期/範圍, server, 執行轉檔動作

- 觸發記錄的顯示
	- 顯示策略的summary顯示
	- 顯示觸發的股票名稱
	- 顯示N日損益

	- 顯示更多的資訊(maybe use tab ?)
		- 觸發明細 (顯示觸發記錄, 損益)
		- 統計資料 (用線圖?來顯示觸發的情形, 總損益可以畫線)
		- ..

- 其他可以做的東西
	- subscription的趨勢
		- 每日的subscription趨勢
		- hottest subscription
		- 每個策略的subscription趨勢












