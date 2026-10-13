# 四班二輪鬧鐘｜開發進度備份（2026-10-13）

## 版本與倉庫
- 測試倉庫：j052571939-lang/shift-calendar-test
- 測試版：V0.5.25，GitHub `version.json` 為 0.5.25。
- PWA 固定入口：https://j052571939-lang.github.io/shift-calendar-test/app-v041.html
- 快照：https://j052571939-lang.github.io/shift-calendar-test/app-v0525.html
- `app-v041.html` 與 `app-v0525.html` 的 GitHub blob SHA 相同：`90ff7c3c9d7667131123c140f0644baf47237fc6`。
- `sw.js` 快取：`shift-calendar-test-auto-v0525`，包含 V0.5.25。
- PWA manifest 的 `id` / `start_url` 均為 `./app-v041.html`，不要更動。
- 正式倉庫：`j052571939-lang/my-shift-2040`；正式版 V8.1.8，**未獲明確授權不得修改**。

## 已完成的功能及既有實測
- Google 登入、選帳號、iPhone ↔ Windows 跨裝置還原及離線編輯後同步：先前使用者曾實測成功。
- 雲端以 Firestore `users/{uid}` 儲存班表、加班請假、記事；使用基準版本、伺服器讀取、交易比對，防止靜默覆蓋。
- 已加入不同欄位三方合併；同一資料有衝突時停止自動覆蓋。
- 已修復日期編輯視窗內記事未儲存就改加班／請假的程式流程；尚待 iPhone 回歸驗證。
- 雲端讀取失敗改中文提示、保留手機資料並安排重新檢查。
- 本次直接讀取 GitHub V0.5.25：兩個 JavaScript script 區塊語法檢查均通過，入口與版本快照 SHA 相同。

## 尚未完成的關卡
1. Firebase 真實連線下的雙裝置同時修改與衝突合併驗證。
2. 網路中斷、伺服器已寫入但客戶端逾時時的恢復驗證。
3. iPhone 上未儲存記事切換請假、加班、關閉視窗的回歸驗證。
4. Firebase 安全規則的模擬器驗證與發布前審核。

## Firebase 規則
- 倉庫檔案：`firestore.rules.review-v1`，**僅是待審核提案，尚未確認部署**。
- 提案：帳號僅能讀寫自己的 `users/{uid}`，拒絕 list/delete，限制 data/schema/updatedAt 格式；未使用的子集合預設拒絕。
- **不得未經授權發布 Firebase 規則。**

## 後續作業規則
1. 每次先讀 GitHub 最新內容，勿假設前一對話版本仍有效。
2. 能自行完成的程式修改、靜態測試、版本檢查全部自行完成；只動測試倉庫。
3. 測試版更新須核對 `app-v041.html`、對應快照、`sw.js`、`version.json`，最後發布 version.json。
4. 禁止清除 Safari 資料、刪除 PWA、重裝、未確認就覆蓋本機或雲端資料。
5. 最後集中一次請使用者完成必要的 iPhone / Firebase 真實驗收。
6. 正式版 V8.1.8 保持原狀，待全部通過且使用者明確授權才可升級。

> 注意：這是**開發進度備份**，不是手機班表、記事或 Firebase 使用者資料的實際備份。
