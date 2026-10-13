# V0.5.25 穩定性驗證｜2026-10-13

目前目標：先穩定既有功能並準備上架；鬧鐘、工時薪資與更多輪班範本暫不擴充。使用者已指出農民曆是既有特色，須保留；本輪未驗證農民曆日期或 UI。

## 驗證基準
- 倉庫：j052571939-lang/shift-calendar-test。
- app-v041.html 與 app-v0525.html：90ff7c3c9d7667131123c140f0644baf47237fc6。
- 測試版本仍為 0.5.25；本輪不修改 App、SW、manifest、version.json 或規則提案。
- Firebase SDK 11.10.0，與 App 載入版本一致。
- 本機工具：Node 24.19.0、Java 17、firebase-tools 14.27.0、Firestore emulator 1.19.8、rules-unit-testing 4.0.1。
- 所有規則及 SDK 測試使用本機 demo-shift-stability；未連線使用者 Firebase，未讀寫真實班表或記事。

## 結果
| 類別 | 通過數 | 方法與範圍 |
|---|---:|---|
| 三方合併及記事保護 | 11 | 執行原始函式；隔離 DOM／儲存模擬 |
| 逾時與恢復 | 9 | 原同步控制流程＋模擬網路／交易／時鐘 |
| 安全規則 | 22 | 官方 Firestore 模擬器，實際編譯 review-v1 |
| SDK 同步整合 | 4 | 真正 Firebase 11.10.0 交易與本機模擬器 |

共 46 項通過；不代表 iPhone 或正式 Firebase 已完成驗收。

另核對：入口與快照一致、版本宣告 0.5.25、SW 快取版本與快照相符、manifest 固定入口不變、version.json 採網路讀取策略。兩個 script 語法通過。這些是程式／檔案檢查，不是 Safari 安裝或更新實測。

### 已涵蓋
- 不同日期記事合併；相同記事衝突保留本機與雲端，停止覆蓋。
- 同日記事與請假欄位合併；刪除與修改衝突停止合併。
- 未儲存記事在改請假、確認加班、關閉視窗時保存；儲存失敗回復記憶體內容。
- 讀取逾時、寫入前失敗、写入成功但回覆逾時、延遲提交、初次備份回覆遺失、恢復網路及逾時後新增記事。
- 本人建立／讀取／更新／交易；拒絕未登入或其他帳號的讀寫；拒絕 list、delete、未使用子集合與錯誤外層格式。
- 真正 SDK 的兩個模擬裝置同時寫入；回覆遺失後重新核對，不重複寫入。

## 尚未完成／限制
1. 真實 iPhone／Windows 與 Firebase 的雙裝置衝突、斷線及逾時驗收。
2. iPhone 上日期視窗記事的實際觸控回歸。
3. 已部署 Firebase 規則的讀取與發布前最終審核。review-v1 僅在本機測試；未發布。
4. 規則目前驗證資料所有權及外層型別，不逐筆檢查 notes／overrides 的日期和值，也不逐欄驗證 schedule 的語意。
5. 本輪未執行瀏覽器／主畫面 PWA／離線重啟或更新實測。
6. App Store 所需 iOS 安裝版本、簽署、登入與隱私流程、送審素材仍待後續準備。PWA 不等於可直接送審的 iOS App。
7. 正式版 V8.1.8 不動；未清除手機資料、未刪除或重裝 PWA。

## 重跑
在倉庫根目錄：
```bash
node tests/verify-sync.cjs
node tests/verify-timeout.cjs
cd tests/rules
npm install
npm test
```
需 Node 20 或以上與 Java 17 或以上；CLI 鎖定 14.27.0。npm test 將根目錄 review-v1 複製到本機測試資料夾後啟動模擬器，不部署規則。
SDK 測試有 Node VM 與 SDK 間的純資料物件轉換，避免跨 realm 物件被 SDK 拒絕；不改動 App 函式或交易版本比對邏輯。
規則測試中預期出現 PERMISSION_DENIED，代表拒絕存取案例通過。

## 資料安全
正式倉庫與 Firebase 規則发布必須取得明確授權。本文件與測試腳本是開發驗證備份，並非使用者資料備份。
