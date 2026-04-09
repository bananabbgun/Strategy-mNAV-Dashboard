# FinTech Assignment — DAT.co Indicator Monitor

## 一、作業要求總覽

### Goal

開發一個網頁平台，監控並視覺化與 DAT.co（Digital Asset Treasury companies）相關的金融指標，輔助投資與交易決策。

### 評分標準

| 項目 | 權重 |
|------|------|
| 正確的資料蒐集 (Correct Data Collection) | 40% |
| 網站視覺化 (Website Visualization) | 40% |
| 報告 (Report) | 20% |
| 加分：AI 摘要 (Bonus: AI Summary) | +10% |

### 必須交付項目

1. **可公開存取的網站**（部署於 Vercel / GCP / AWS 等）
2. **報告**，須包含：
   - 選擇的指標及理由
   - 該指標與 BTC 的關聯性分析
   - 網站的部署網址

---

## 二、方案選擇：mNAV（MicroStrategy）

### 什麼是 mNAV

mNAV（Modified Net Asset Value multiplier）是衡量 DAT.co 公司估值最核心的指標之一。

計算公式：

```
mNAV = 公司市值 / (公司持有的 BTC 數量 × BTC 當前價格)
```

- **mNAV > 1**：市場對公司持有的比特幣給出「溢價」(Premium)，代表投資人認為公司的 BTC 策略有附加價值
- **mNAV < 1**：市場對公司持有的比特幣給出「折價」(Discount)，代表市場不看好該公司的 BTC 持倉策略
- **mNAV = 1**：公司市值剛好等於其 BTC 持倉的市場價值

### 為什麼選 MicroStrategy (MSTR)

- 全球持有最多比特幣的上市公司（截至 2025 年持有超過 50 萬枚 BTC）
- 資料透明度高，定期公開揭露持倉數量
- 市場討論度最高的 DAT.co 標的，報告容易找到佐證資料
- 股價資料透過 Yahoo Finance 免費取得，BTC 價格透過 CoinGecko 免費取得

### mNAV 與 BTC 的關聯性

| 情境 | mNAV 表現 | 解釋 |
|------|-----------|------|
| BTC 大漲 | mNAV 通常上升 | 市場樂觀情緒推動股價超漲，溢價擴大 |
| BTC 大跌 | mNAV 通常下降 | 恐慌情緒使股價跌幅超過 BTC，溢價收窄甚至轉折價 |
| BTC 橫盤 | mNAV 趨於收斂 | 市場情緒回歸理性，溢價縮小 |
| 公司宣布增持 BTC | mNAV 短期跳升 | 市場解讀為利好訊號 |

mNAV 本質上是一個「市場情緒放大器」——它反映了投資人對 BTC 未來走勢的預期，而非 BTC 本身的基本面。

---

## 三、技術架構

### 總體架構圖

```
┌─────────────────────────────────────────────────┐
│                   使用者瀏覽器                     │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  mNAV 圖表   │  │  BTC 對照線  │  │ AI 摘要區 │ │
│  │  (Recharts)  │  │  (Recharts)  │  │  (Claude) │ │
│  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│         │                │               │        │
│         └────────┬───────┘               │        │
│                  ▼                       ▼        │
│          讀取靜態 JSON            POST /api/summary │
└──────────────────────────────────────────────────┘
                   │                       │
                   ▼                       ▼
            public/data.json      Next.js API Route
                                         │
                                         ▼
                                   Claude API
```

### 技術棧

| 層級 | 技術選擇 | 理由 |
|------|----------|------|
| 資料蒐集 | Python + yfinance + CoinGecko API | 成熟穩定，社群資源多 |
| 資料儲存 | 靜態 JSON 檔 | 零成本、零風險、前端直接讀取 |
| 前端框架 | Next.js (React) | Vercel 原生支援，部署零設定 |
| 圖表庫 | Recharts | React 原生整合，API 直觀 |
| AI 摘要 | Claude API (Anthropic) | 品質高、Node SDK 簡潔 |
| 部署 | Vercel | 免費方案足夠、自動 CI/CD |
| 樣式 | Tailwind CSS | 快速開發、不需寫獨立 CSS |

---

## 四、資料蒐集方案（40%）

### 需要的原始資料

| 資料 | 來源 | 取得方式 | 頻率 |
|------|------|----------|------|
| BTC 每日收盤價 (USD) | CoinGecko API | 免費 REST API，不需 API key | 日頻 |
| MSTR 每日收盤價 (USD) | Yahoo Finance | `yfinance` Python 套件 | 日頻（交易日） |
| MSTR 流通股數 | Yahoo Finance | `yfinance` 取得 `sharesOutstanding` | 隨季報更新 |
| MSTR BTC 持倉量 | 公開揭露 / bitcointreasuries.net | 手動整理或爬蟲 | 隨公告更新 |

### mNAV 計算流程

```python
# 虛擬碼
market_cap = mstr_close_price * shares_outstanding
btc_holding_value = btc_count * btc_price
mnav = market_cap / btc_holding_value
```

### 持倉量處理策略

MicroStrategy 不定期公告增持 BTC，兩次公告之間持倉量視為不變。處理方式：

1. 建立一個持倉量時間表（key dates + BTC count）
2. 對每個交易日，向前查找最近一次公告的持倉量
3. 用該持倉量計算當天的 mNAV

### 輸出 JSON 格式

```json
[
  {
    "date": "2024-01-02",
    "btc_price": 45123.45,
    "mstr_price": 620.30,
    "mstr_market_cap": 10350000000,
    "btc_holdings": 189150,
    "btc_holdings_value": 8534883067.5,
    "mnav": 1.213
  },
  ...
]
```

### Python 腳本結構

```
data/
├── fetch_data.py          # 主腳本：抓資料、計算 mNAV、輸出 JSON
├── btc_holdings.json      # 手動維護的 MSTR BTC 持倉時間表
└── output/
    └── mnav_data.json     # 最終產出，複製到前端 public/
```

---

## 五、網站視覺化方案（40%）

### 頁面佈局

```
┌──────────────────────────────────────────────┐
│  🏦 MicroStrategy mNAV Dashboard             │
├──────────────────────────────────────────────┤
│                                              │
│  [30D] [90D] [1Y] [ALL]    時間範圍選擇器     │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │     mNAV 折線圖（左 Y 軸）            │    │
│  │     BTC 價格折線圖（右 Y 軸）          │    │
│  │     mNAV = 1 的水平參考線             │    │
│  │                                      │    │
│  │     X 軸：日期                        │    │
│  │     tooltip：顯示當日完整數據          │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  📊 Key Metrics                      │    │
│  │  Current mNAV: 2.15                  │    │
│  │  30D Change: +12.3%                  │    │
│  │  BTC Holdings: 538,200 BTC           │    │
│  │  Premium: 115%                       │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  🤖 AI Analysis                      │    │
│  │  [Generate Summary]  ← 按鈕觸發       │    │
│  │                                      │    │
│  │  AI 生成的趨勢摘要顯示在這裡...        │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  ℹ️ About                            │    │
│  │  指標說明、資料來源、計算方式           │    │
│  └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

### 圖表功能需求

- **雙 Y 軸**：左軸 mNAV（倍數）、右軸 BTC 價格（USD）
- **mNAV = 1 參考線**：清楚標示溢價/折價分界
- **時間範圍切換**：30 天 / 90 天 / 1 年 / 全部
- **Tooltip**：hover 時顯示日期、mNAV、BTC 價格、市值、持倉量
- **Responsive**：手機和桌面都能正常顯示

### 前端檔案結構

```
app/
├── layout.tsx              # 全域 layout + metadata
├── page.tsx                # 首頁，組合所有 component
├── api/
│   └── summary/
│       └── route.ts        # Claude API endpoint
├── components/
│   ├── MnavChart.tsx       # 主圖表元件
│   ├── TimeRangeSelector.tsx
│   ├── KeyMetrics.tsx      # 關鍵數據卡片
│   ├── AiSummary.tsx       # AI 摘要區塊
│   └── AboutSection.tsx    # 指標說明
├── lib/
│   └── types.ts            # TypeScript 型別定義
└── public/
    └── mnav_data.json      # 靜態資料
```

---

## 六、AI 摘要方案（+10% Bonus）

### 運作流程

```
使用者點擊 "Generate Summary"
        │
        ▼
前端取得當前時間範圍內的 mNAV 資料
        │
        ▼
POST /api/summary  { data: [...最近N天的數據] }
        │
        ▼
API Route 組合 prompt + 資料，呼叫 Claude API
        │
        ▼
回傳 AI 摘要文字，前端顯示
```

### Prompt 設計

```
你是一位專業的加密貨幣與股票分析師。
以下是 MicroStrategy (MSTR) 的 mNAV 指標數據，時間範圍為 {startDate} 至 {endDate}。

mNAV = 公司市值 / (BTC 持倉量 × BTC 價格)

數據：
{JSON 數據}

請提供以下分析：
1. 趨勢摘要：mNAV 在這段期間的整體走勢
2. 關鍵觀察：是否有異常波動或轉折點
3. 與 BTC 的關聯：mNAV 變化與 BTC 價格變化的關係
4. 市場情緒：目前的溢價/折價水準代表什麼

請用繁體中文回答，保持專業但易懂。
```

### 技術細節

- 使用 Anthropic Node SDK (`@anthropic-ai/sdk`)
- 模型：`claude-sonnet-4-20250514`（成本低、速度快、品質足夠）
- API key 放在 Vercel 環境變數，不進 Git
- 前端顯示 loading 狀態，處理 API 錯誤的 fallback

---

## 七、部署方案

### Vercel 部署流程

```
1. GitHub repo push
2. Vercel 自動偵測 Next.js 專案
3. 自動 build + deploy
4. 取得公開網址：https://your-project.vercel.app
```

### 環境變數設定（Vercel Dashboard）

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 部署前 checklist

- [ ] `mnav_data.json` 已放入 `public/`
- [ ] API route 正常運作
- [ ] 手機版面正常
- [ ] 環境變數已設定
- [ ] 圖表載入無錯誤

---

## 八、報告大綱

### 1. Selected Indicator

- 指標名稱：mNAV (Modified Net Asset Value)
- 計算公式與說明
- 選擇理由：最主流、資料最完整、直觀反映市場對 BTC 持倉公司的估值態度

### 2. Relationship with Bitcoin

- mNAV 隨 BTC 價格的波動放大效應
- 歷史案例分析（搭配圖表截圖）
  - 2024 BTC 牛市期間 mNAV 飆升至 3+ 的現象
  - 市場修正時 mNAV 收斂的行為
- mNAV 作為市場情緒指標的解讀框架

### 3. Deployed Website URL

- 提供 Vercel 部署的公開網址

---

## 九、開發順序與時程建議

| 步驟 | 任務 | 預估時間 | 對應分數 |
|------|------|----------|----------|
| 1 | Python 資料蒐集腳本 + 產出 JSON | 2-3 小時 | 40% |
| 2 | Next.js 專案初始化 + 圖表實作 | 3-4 小時 | 40% |
| 3 | AI 摘要 API route + 前端整合 | 1-2 小時 | +10% |
| 4 | UI 美化 + Responsive 調整 | 1 小時 | — |
| 5 | 部署到 Vercel | 30 分鐘 | — |
| 6 | 撰寫報告 | 1-2 小時 | 20% |
| **合計** | | **約 8-12 小時** | **110%** |

---

## 十、風險與對策

| 風險 | 對策 |
|------|------|
| CoinGecko API 限速 | 資料預抓存成 JSON，不即時呼叫 |
| MSTR 持倉量資料不完整 | 手動維護 key dates，缺漏期間用前值填充 |
| Claude API 呼叫失敗 | AI 摘要設計為 optional，失敗時顯示 fallback 訊息 |
| Vercel 免費方案限制 | 靜態資料 + 單一 API route，遠低於免費額度 |
| Yahoo Finance 資料缺漏（假日） | 只取交易日資料，前端圖表自動跳過非交易日 |
