# 吋讀 Tsundoku

家庭藏書登記與查詢的 PWA。目前是**第一階段**：地基、房間與書櫃編輯器、匯出備份。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 整個網站（畫面與程式都在這個檔案裡） |
| `sw.js` | 讓網站能安裝到手機、離線打開 |
| `manifest.webmanifest` | 安裝到手機時的名稱與圖示 |
| `logo-mark.png` | 畫面上用的 logo |
| `icon-192.png`、`icon-512.png`、`icon-maskable-512.png`、`apple-touch-icon.png`、`favicon-64.png` | 手機桌面與瀏覽器分頁的圖示 |
| `firestore.rules` | Firestore 安全規則（要貼到 Firebase 主控台，不會被網站讀取） |

Firebase 設定值**不在**任何檔案裡，是第一次打開網站時貼上、只存在那台裝置。所以 repo 可以公開。

## 第一次設定

### 1. Firebase（在 Tsundoku 專案裡）

1. **建置 → Firestore Database → 建立資料庫**
   - 版本選 Standard
   - 位置選 `asia-east1`（台灣），之後不能改
   - 以「正式版模式」開始
2. **Firestore → 規則**：把 `firestore.rules` 整段貼上，把 `YOUR_EMAIL@gmail.com` 改成你的 Gmail，按「發布」。
3. **建置 → Authentication → 開始使用 → 登入方式 → Google**：啟用，選一個支援電子郵件，儲存。
4. **Authentication → 設定 → 授權網域 → 新增網域**：輸入 `你的帳號.github.io`。
5. **專案設定（齒輪）→ 一般 → 你的應用程式 → 網頁（`</>` 圖示）**：暱稱填 Tsundoku，不用勾 Firebase Hosting，註冊後複製整段 `firebaseConfig`。

### 2. GitHub Pages

1. 打開 Tsundoku repo → **Add file → Upload files**，把這個資料夾裡的所有檔案拖進去 → **Commit changes**。
2. **Settings → Pages → Build and deployment**：Source 選 *Deploy from a branch*，Branch 選 `main` 和 `/ (root)` → **Save**。
3. 等一兩分鐘，網址會是 `https://你的帳號.github.io/Tsundoku/`（大小寫要跟 repo 名稱一樣）。

### 3. 第一次打開

1. 手機用 Chrome 打開網址 → 貼上 `firebaseConfig` → 連接 → 用 Google 帳號登入。
2. Chrome 選單 → **加到主畫面**（或「安裝應用程式」）。
3. 電腦要用的話，同樣貼一次設定、登入一次。

### 之後更新網站

把新版的檔案用 **Upload files** 覆蓋上傳即可。repo 裡如果還有舊的 `icon.svg`，可以刪掉，新版已經不用它了。手機上的網站下次打開會自動抓新版；如果沒更新，關掉再開一次。

## 第一階段測試清單

- [ ] 新增房間；改名、調整順序、刪除空房間
- [ ] 新增書櫃，用格子編輯器設定：開關格子、拖曳一次改多格、整排切換、高格、深度、由下往上編號
- [ ] 手機和電腦各開一次，確認書櫃資料會同步
- [ ] 關掉網路新增一個書櫃，再打開網路，確認另一台裝置看得到
- [ ] 設定頁：新增／移除所有者
- [ ] 匯出完整備份、匯出書目 CSV、從備份還原（合併與全部取代）
- [ ] 用另一個 Google 帳號登入，應該顯示「沒有讀寫權限」
- [ ] 安裝到主畫面後，在飛航模式下也能打開

## 資料存放位置

所有資料都在 Firestore 的 `users/{你的使用者 ID}/` 底下：

| 集合 | 內容 |
| --- | --- |
| `rooms` | 房間 |
| `cabinets` | 書櫃（列數、欄數、預設深度、編號方向、關掉的格子、高格、個別深度） |
| `books` | 書籍（第二階段開始寫入；欄位規格見 `index.html` 裡的 `newBook`） |
| `photos` | 版權頁與藏書章照片（第二階段開始寫入） |
| `categories` | 分類樹（第三階段開始寫入） |
| `meta/settings` | 所有者選項、上次備份時間 |
