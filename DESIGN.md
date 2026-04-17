# DESIGN.md — Wacca（ワッカ）

> このファイルはAIエージェントが正確な日本語UIを生成するためのデザイン仕様書です。
> Waccaはイベント主催者とキッチンカー・屋台出店者をマッチングするWebプラットフォーム。
> Store（出店者向け）とOrganizer（主催者向け）の2アプリで構成され、
> レイアウト・コンポーネントは統一し、テーマカラーのみ差別化する。

---

## 1. Visual Theme & Atmosphere

- **デザイン方針**: カジュアル、温かみのある、親しみやすい
- **密度**: 適度にゆったり。業務ツール的な詰め込みは避け、余白を活かす
- **キーワード**: 温かみ、楽しさ、つながり、信頼、歓迎
- **参考テイスト**: Cookpad — 家庭的で温かみのあるUGCプラットフォーム
- **ビューポート基準**: PC-first（1440px）、レスポンシブ対応
- **UI言語**: 日本語のみ。UIにemojiは使用しない

### ブランドストーリー

「ワッカ」= 輪。主催者と出店者が出会い、つながる「輪」をつくるプラットフォーム。
お祭りやマルシェのような賑わいの中にも、安心してビジネスができる信頼感を両立する。

---

## 2. Color Palette & Roles

### アプリ別テーマカラー

このプラットフォームは2つのアプリで構成される。色の方向性は以下の通りだが、
**最終的な色はStitchでの生成結果を見て確定する**。

#### Store（出店者向け）— Green系

意味: **安心・信頼** — 出店者が安心してビジネスできるプラットフォーム

| Token | 候補値 | 備考 |
|-------|--------|------|
| Primary | #10b981 〜 #059669 | 現状Emerald 500-600。深めで落ち着いた方向を検討 |
| Primary Light | #34d399 〜 #6ee7b7 | ハイライト、バッジ背景 |
| Primary Dark | #047857 〜 #065f46 | ホバー、強調テキスト |

#### Organizer（主催者向け）— Orange系

意味: **温かみ・歓迎** — 出店者を迎え入れるホスピタリティ

| Token | 候補値 | 備考 |
|-------|--------|------|
| Primary | #f28c06 〜 #f97316 | Cookpad風の温かいオレンジを検討 |
| Primary Light | #fbbf24 〜 #fdba74 | ハイライト、バッジ背景 |
| Primary Dark | #d97a00 〜 #ea580c | ホバー、強調テキスト |

### Semantic（共通）

- **Success** (`#22c55e`): 成功、完了、承認
- **Warning** (`#eab308`): 警告、注意喚起、保留
- **Danger** (`#ef4444`): エラー、削除、却下
- **Info** (`#3b82f6`): 情報、ヒント

### Neutral（共通 — Slate系）

- **Text Primary** (`#0f172a`): 見出し、重要テキスト
- **Text Body** (`#334155`): 本文テキスト
- **Text Secondary** (`#64748b`): 補足、ラベル
- **Text Disabled** (`#94a3b8`): 無効状態
- **Border** (`#e2e8f0`): 区切り線、入力欄の枠
- **Background**: `#ffffff` または `#f8f6f2`（温かみのあるオフホワイト）→ **Stitchで比較して確定**
- **Surface** (`#ffffff`): カード、モーダルの面

### Accent（カテゴリタグ用）

- Pink: `#ec4899`
- Yellow: `#eab308`
- Purple: `#8b5cf6`
- Sky: `#0ea5e9`

---

## 3. Typography Rules

### 3.1 和文フォント

- **ゴシック体**: Noto Sans JP（400, 500, 600, 700）

### 3.2 欧文フォント

- **サンセリフ**: Noto Sans JP に内包される欧文グリフを使用

### 3.3 font-family 指定

```css
font-family: "Noto Sans JP", system-ui, -apple-system, sans-serif;
```

### 3.4 文字サイズ・ウェイト階層

| Role | Size | Weight | Line Height | Letter Spacing | 備考 |
|------|------|--------|-------------|----------------|------|
| Display | 48px | 900 | 1.2 | -0.02em | ヒーロー見出し（1ページ1箇所まで） |
| Heading 1 | 30px | 700 | 1.3 | -0.01em | ページタイトル |
| Heading 2 | 24px | 700 | 1.4 | 0 | セクション見出し |
| Heading 3 | 18px | 600 | 1.5 | 0 | サブセクション |
| Body | 16px | 400 | 1.7 | 0.04em | 本文 |
| Small | 14px | 500 | 1.6 | 0.04em | 補足テキスト |
| Caption | 12px | 400 | 1.5 | 0.04em | 注釈、タイムスタンプ |

### 3.5 行間・字間

- **本文の行間**: `line-height: 1.7`（日本語の可読性重視）
- **見出しの行間**: `line-height: 1.3〜1.5`
- **本文の字間**: `letter-spacing: 0.04em`
- **見出しの字間**: `letter-spacing: 0〜-0.01em`（詰め気味）

### 3.6 禁則処理・改行ルール

```css
word-break: break-all;
overflow-wrap: break-word;
line-break: strict;
```

### 3.7 OpenType 機能

```css
/* 見出し・ナビゲーション */
font-feature-settings: "palt" 1, "kern" 1;

/* 本文にはpaltを適用しない */
```

---

## 4. Component Stylings

### 全体方針

Cookpad風の温かみのある丸みを帯びたUI。角丸は大きめ（8px〜12px）。
影はソフト。アクティブな色使いだが落ち着いたトーン。

### Buttons

**Primary**
- Background: テーマカラー Primary
- Text: `#ffffff`
- Padding: 12px 24px
- Border Radius: 12px（rounded-xl）
- Font Size: 16px
- Font Weight: 600
- Hover: Primary Dark + translateY(-1px)

**Secondary**
- Background: `transparent`
- Text: テーマカラー Primary
- Border: 1px solid テーマカラー Primary
- Padding: 12px 24px
- Border Radius: 12px

**Ghost**
- Background: `transparent`
- Text: Text Secondary
- Hover: Background に Neutral の薄い色

### Inputs

- Background: `#ffffff`
- Border: 1px solid `#e2e8f0`
- Border (focus): 2px solid テーマカラー Primary
- Border Radius: 8px
- Padding: 12px 16px
- Font Size: 16px
- Height: 48px

### Cards

- Background: `#ffffff`
- Border: 1px solid `#f1f5f9`（または border なし）
- Border Radius: 12px
- Padding: 24px
- Shadow: `0 1px 3px rgba(0,0,0,0.06)`
- Hover: `translateY(-2px)` + `0 8px 24px rgba(0,0,0,0.08)`

---

## 5. Layout Principles

### Spacing Scale

| Token | Value |
|-------|-------|
| XS | 4px |
| S | 8px |
| M | 16px |
| L | 24px |
| XL | 32px |
| XXL | 48px |
| XXXL | 64px |

### Container

- Max Width: 1280px
- Padding (horizontal): 32px

### Grid

- Columns: 12
- Gutter: 24px

### Header

- Height: 64px
- Position: sticky top-0
- Background: white / blur backdrop

---

## 6. Depth & Elevation

| Level | Shadow | 用途 |
|-------|--------|------|
| 0 | none | フラットな要素 |
| 1 | `0 1px 3px rgba(0,0,0,0.06)` | カード（静止時） |
| 2 | `0 4px 12px rgba(0,0,0,0.08)` | ドロップダウン、ポップオーバー |
| 3 | `0 8px 24px rgba(0,0,0,0.08)` | カード（ホバー時）、モーダル |

影はソフトに。Cookpad的な柔らかい影を意識。`rgba(0,0,0,0.06〜0.08)` の範囲。

---

## 7. Do's and Don'ts

### Do（推奨）

- フォントは必ずフォールバックチェーンを指定する
- 日本語本文の line-height は 1.5 以上にする
- 色のコントラスト比は WCAG AA 以上を確保する
- コンポーネントの余白は Spacing Scale に従う
- ボタンやカードには丸みを持たせる（rounded-xl: 12px）
- 温かみのある影を使用する（opacity 低め）
- Store と Organizer で同一のレイアウト・コンポーネント構造を維持する

### Don't（禁止）

- UIにemojiを使用しない
- テキストの色に純粋な `#000000` を使わない
- 日本語本文に `line-height: 1.2` 以下を使わない
- 角丸なしの完全な直角ボタンを使わない
- 強いドロップシャドウ（opacity 0.2以上）を使わない
- Store/Organizer 間でレイアウト構造を変えない（色のみ変える）

---

## 8. Responsive Behavior

### Breakpoints

| Name | Width | 説明 |
|------|-------|------|
| Mobile | ≤ 640px | モバイルレイアウト |
| Tablet | ≤ 1024px | タブレットレイアウト |
| Desktop | > 1024px | デスクトップレイアウト（基準） |

### デザイン方針

- PC-first: デスクトップを基準にデザインし、モバイルに縮退
- タッチターゲット: 最小 44px × 44px

---

## 9. Agent Prompt Guide

### Wacca のUI生成時に必ず守ること

1. このDESIGN.mdのルールに従うこと
2. Store と Organizer でレイアウトは同一、テーマカラーのみ変える
3. 日本語UI、emojiなし
4. Cookpad的な温かみ・親しみやすさを意識
5. アプリ固有の色は `store/DESIGN.md` または `organizer/DESIGN.md` を参照

### プロンプト例

```
Waccaの出店者向け（Store）ホーム画面を作成してください。
- テーマカラー: Green系（安心・信頼）
- テイスト: カジュアル、温かみ、Cookpad風
- フォント: Noto Sans JP
- 角丸: 12px（ボタン・カード）
- 背景: オフホワイト候補 #f8f6f2
- emojiなし、日本語UI
- PC-first (1440px)
```
