# 四班二輪 V8.0.4 — GitHub 線上驗證專用版（不可作正式站）

本版的 GitHub Actions **只可手動啟動**、權限 **contents: read**，不提交、不推送、不更新 GitHub Pages，專門用來檢查政府網站真實下載、Excel 解析、日曆回歸測試。

## 下一步（獨立測試儲存庫）
1. 建立全新的 GitHub 測試儲存庫（例如 `shift-calendar-test`），**不要使用正在運作的 `my-shift-2040`**。
2. 將 ZIP 解壓縮後的全部檔案及資料夾上傳到測試儲存庫 `main`，包括隱藏的 `.github/workflows/update-calendar.yml`。
3. 開啟儲存庫的 **Actions** → **DGPA online verification (no publishing)** → **Run workflow**。
4. 查看每一步的綠勾或紅叉及錯誤日誌；必須看到 `Download real DGPA attachments`、`Parse downloaded Excel and validate dates` 成功，才算線上驗證通過。
5. 若政府公告 HTML 或附件名稱與模擬測試不同，下載步驟會失敗，不會修改正式網站。

## 驗收界線
- 本機測試不能證明政府網站實際可下載，也不能證明 GitHub Actions 已跑成功。
- 此版只驗證 2026、2027 年；2028～2040 仍屬推估。
- `holiday_labels.json` 名稱仍待逐筆官方核對。
- iPhone PWA 不能直接建立 iOS 系統鬧鐘。
- **不要把本版直接上傳目前正式 GitHub Pages 儲存庫。**
