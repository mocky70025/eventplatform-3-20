# Wacca Design System v1.0

`design/04-concept-wacca.md` で確定したブランドを、コードで実装可能な形に落とした仕様書。
3アプリ（organizer / store / admin）の共通基盤。

---

## 1. デザイン原則（判断基準のソース）

| # | 原則 | これがあると判断できる |
|---|---|---|
| 1 | **信頼でつながる** | 「これは業務システム的すぎないか？」「相手の信頼性が視覚化されているか？」 |
| 2 | **ひと画面で完結する** | 「ユーザーがタブを切替えずに完結できるか？」「情報密度は適切か？」 |
| 3 | **写真で語る** | 「テキスト前に画像で世界観が伝わるか？」「Instagram風グリッドで判断できるか？」 |
| 4 | **シニアにも刺さる** | 「18px以上か？タッチ56px以上か？カタカナ用語は避けられているか？」 |
| 5 | **ひとつの輪** | 「3アプリで一貫性があるか？同じパーツを使い回せているか？」 |

迷ったらこの5つに照らす。

---

## 2. デザイントークン

実装は `tokens.css` 参照。ここはレファレンス。

### カラー

| 役割 | トークン | 値 | 用途 |
|---|---|---|---|
| **Brand Navy** | `wacca-navy-600` | `#1e3a5f` | ヘッダー・主要文字・信頼基盤 |
| **Brand Orange** | `wacca-orange-500` | `#f97316` | CTA・organizerアクセント |
| **Brand Green** | `wacca-green-500` | `#16a34a` | storeアクセント・採用 |
| **Brand Cream** | `wacca-cream-100` | `#fdf8f1` | デフォルト背景 |
| **Surface** | `wacca-cream-200` | `#f8f6f2` | カード背景（やや暖色） |
| Text Primary | `neutral-900` | `#0f172a` | 見出し・重要 |
| Text Body | `neutral-700` | `#334155` | 本文 |
| Text Secondary | `neutral-500` | `#64748b` | 補足 |
| Border | `neutral-200` | `#e2e8f0` | 区切り線 |
| Success | `success-500` | `#22c55e` | 承認・成功 |
| Warning | `warning-500` | `#eab308` | 保留・期限 |
| Danger | `danger-500` | `#ef4444` | エラー・却下 |
| Info | `info-500` | `#3b82f6` | 情報・ヒント |
| Gold | `gold-500` | `#eab308` | Gold Starバッジ |

各色 50〜950 の階調あり（`tokens.css` 参照）。

### タイポグラフィ

| Role | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| Display | 64px | 900 | 1.2 | -0.02em |
| Heading 1 | 36px | 700 | 1.3 | -0.01em |
| Heading 2 | 30px | 700 | 1.3 | -0.01em |
| Heading 3 | 24px | 700 | 1.4 | 0 |
| Heading 4 | 20px | 600 | 1.5 | 0 |
| Body | **18px** | 400 | 1.7 | 0.04em |
| Body Bold | 18px | 600 | 1.7 | 0.04em |
| Small | 14px | 500 | 1.6 | 0.04em |
| Caption | 12px | 400 | 1.5 | 0.04em |

**シニアモード**：基本サイズが 20px に拡大。

### スペーシング（4の倍数）

`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`

最頻使用：`16, 24, 32`（コンポーネント内余白）／`48, 64`（セクション間）

### Radius

| トークン | 値 | 用途 |
|---|---|---|
| `radius-sm` | 6px | チップ、小バッジ |
| `radius-md` | 12px | **ボタン・カード（デフォルト）** |
| `radius-lg` | 16px | モーダル・大カード |
| `radius-xl` | 24px | フィーチャーカード |
| `radius-full` | 9999px | ピル型、アバター |

### Shadow

| トークン | 用途 |
|---|---|
| `shadow-sm` | カード静止時 |
| `shadow-md` | ドロップダウン |
| `shadow-lg` | カードホバー・モーダル |
| `shadow-xl` | 浮遊要素・FAB |

opacity は 0.06〜0.10 で固定（強い影禁止）。

### Motion

| | 値 |
|---|---|
| Duration fast | 150ms（ホバー） |
| Duration base | 200ms（基本） |
| Duration slow | 300ms（ダイアログ・トースト） |
| Easing standard | `cubic-bezier(0.2, 0, 0, 1)` |

---

## 3. コンポーネント（Core 15）

### C1. Button

主要なアクション要素。

**バリアント**：
- **Primary**: 主CTA（背景=テーマカラー、白文字）
- **Secondary**: 副次（透明背景、テーマカラー枠線＆文字）
- **Ghost**: 控えめ（透明背景、グレー文字、hoverで背景着色）
- **Danger**: 破壊的アクション（赤背景）
- **SeniorLarge**: シニア向け超大ボタン（高さ72px、20px文字）

**サイズ**：
- `sm`: 高さ 36px、padding 8/16
- `md`: 高さ 48px、padding 12/24（デフォルト）
- `lg`: 高さ 56px、padding 16/32
- `senior`: 高さ 72px、padding 20/40

**状態**：default / hover (translateY -1px + dark) / active / focus (outline) / disabled / loading

**Do / Don't**：
- ✓ 1画面で Primary は1つだけ
- ✓ アイコン併用OK、左or右に統一
- ✗ 角丸なし禁止
- ✗ 影は載せない（フラット）

### C2. TextInput

**バリアント**：text / number / email / password / search

**状態**：default / focused / filled / error / disabled

**Anatomy**：
```
[ラベル（required: *）]
[アイコン左] [入力欄] [アイコン右/クリアボタン]
[ヘルプテキスト or エラーメッセージ]
```

**仕様**：
- Height 48px（シニアモード 56px）
- Padding 12px 16px
- Border 1px → focused時 2px primary
- Border radius 8px
- フォーカスリングはアクセシビリティ用に必ず可視

### C3. Textarea

TextInputと同様のスタイル、複数行。
- 最小高さ 96px
- リサイズ垂直方向のみ
- 文字数カウンター（任意）下右

### C4. Select

ネイティブ select の見た目を統一。
- 右に Chevron アイコン
- 「選択してください」placeholder
- option は単選択

### C5. Checkbox + Radio

**Checkbox**：複数選択
**Radio**：単選択

**共通**：
- 24px サイズ（シニア 28px）
- チェック状態は Orange（organizer）/ Green（store）
- ラベルは右、12px間隔
- グループ時は縦並びデフォルト、横並び可

**Wacca固有用途**：
- 火気使用機材（Checkbox 複数）
- 発電機種類（Radio 単選択）
- 消火器状態（Radio）

### C6. Card

汎用カード。slot形式。

**Anatomy**：
```
[image slot（任意）]
[header slot]
[body slot]
[footer slot]
```

**仕様**：
- Background `#ffffff`
- Border 1px `neutral-200` または なし
- Radius `radius-md`（12px）
- Padding 24px
- Hover: translateY(-2px) + shadow-lg
- Transition 200ms standard

### C7. EventCard

Cardの派生。イベント表示用。

**Anatomy**：
```
[メイン画像（16:9 or 4:3）]
[カテゴリチップ × ジャンル]
[H3 イベント名]
[日時アイコン + 日時]
[場所アイコン + 場所]
[フッター: 出店料 + 残枠表示 + CTA「申請する」]
```

### C8. ApplicationCard

Cardの派生。応募審査用（organizer側）。

**Anatomy**：
```
[ステータスバッジ（右上）]
[出店者写真（3枚グリッド）]
[出店者名 + Gold Starバッジ]
[出店形態 + カテゴリチップ]
[評価（星 + レビュー数）]
[フッター: 承認 / 保留 / 不採用 ボタン]
```

### C9. Badge

**バリアント**：
- **Status**: 申請中（yellow）/ 採用（green）/ 不採用（neutral）/ 補欠（blue）
- **Category**: ジャンル別（13カラー）
- **Count**: 数値（red dot or 数字）

**サイズ**：
- `xs`: 4px 8px、10px text
- `sm`: 4px 12px、12px text
- `md`: 6px 12px、14px text

Pill型（radius-full）デフォルト。

### C10. GoldStarBadge（Wacca固有）

「Wacca Gold Star認定」専用。

**Anatomy**：
```
[★アイコン（金色グラデ）][ Gold Star ]
```
- Background: `linear-gradient(135deg, gold-400, gold-500)`
- Text: white
- Border: gold-600
- Shadow: gold tint subtle glow
- フォント: bold

### C11. Avatar

**バリアント**：User / Store / Organizer

**サイズ**：
- xs: 24px、sm: 32px、md: 48px、lg: 64px、xl: 96px

**Anatomy**：
- 円形デフォルト（radius-full）
- 画像 or イニシャル（背景色 = ハッシュ生成）
- Store用は角丸変形可（屋号ロゴ的）
- Gold Star 認定者は金色枠線

### C12. TopNav

**バリアント**：Desktop / Mobile

**Desktop Anatomy**：
```
[Logo左] [メニュー中央] [通知 + Avatar右]
```

**Mobile Anatomy**：
- ハンバーガー左 / Logo中央 / Avatar右
- 開くとDrawer表示

**仕様**：
- Height 64px
- Background white + backdrop-blur
- Sticky top-0
- Border-bottom 1px

### C13. Tabs

**Anatomy**：
```
[Tab1] [Tab2] [Tab3] ...
─────  下線（active色）
[コンテンツエリア]
```

**仕様**：
- Underline form（borders-bottom）
- Active: テーマカラー（organizer=orange / store=green）
- Hover: グレー下線
- Padding 12px 16px

### C14. Modal

**バリアント**：Confirm / Form / Image

**Anatomy**：
```
[Overlay (rgba 0,0,0,0.4)]
  [Modal Container]
    [Header: Title + Close]
    [Body]
    [Footer: Cancel + Primary CTA]
```

**仕様**：
- 最大幅 540px（Form は 720px）
- Padding 32px
- Radius `radius-lg`（16px）
- Shadow `shadow-xl`
- Overlay クリックで close
- ESC で close
- Focus trap 必須（アクセシビリティ）

### C15. PhotoGrid

Instagram風 3×N グリッド。

**Anatomy**：
```
[image][image][image]
[image][image][image]
...
```

**仕様**：
- 3カラム固定（モバイル 2カラム）
- gap 4px（タイト）
- 各画像 aspect-square
- hover: 軽く zoom + overlay
- クリックで lightbox/modal

**用途**：
- 出店者プロフィール写真ギャラリー
- 主催者の過去イベント写真
- 申請一覧のサムネ

---

## 4. アクセシビリティ・ガイドライン

| 項目 | ルール |
|---|---|
| **コントラスト比** | WCAG AA 以上（本文 4.5:1、大文字 3:1）／シニア対応箇所は **AAA** (7:1) |
| **フォーカス** | 全インタラクティブ要素に可視フォーカスリング（outline 2px primary + offset 2px） |
| **タッチターゲット** | 最小 56px × 56px（シニアモード 64px） |
| **キーボード操作** | Tab順序の論理性、Modal のフォーカストラップ、ESC で閉じる |
| **スクリーンリーダー** | `aria-label`、`aria-describedby`、状態アナウンス（live region） |
| **動きへの配慮** | `prefers-reduced-motion` 尊重、自動再生なし |
| **エラー表示** | 色だけで伝えない、アイコン＋テキスト併用 |

---

## 5. ライティング・ガイド

### カタカナ用語の言い換え

| ❌ NG | ✅ OK |
|---|---|
| アップロード | ファイルを送る |
| キャンセル | やめる／中止する |
| ログイン | サインイン／入る |
| サインアップ | はじめての登録 |
| エラー | ◯◯ができませんでした |
| ダウンロード | ファイルを受け取る／PDFを開く |
| プロフィール | あなたの情報／お店の情報 |
| メンテナンス | お休み中 |
| ステータス | 状態 |
| ユーザー | あなた／お客さま |

### ボタン文言

- 動詞で終わる：「申請する」「承認する」「保存する」
- 短く：6文字以内目標
- Primaryは行動を示す、Secondaryは取り消しや戻る

### エラー文

定型：「**[何が]ができませんでした**。[なぜ]。[どうすれば]」

例：
- ❌「Validation Error: email is invalid」
- ✅「メールアドレスの形式が正しくありません。@マークの前後をご確認ください」

### 確認文

定型：「**本当に [動作] しますか？** [影響]」

例：
- ❌「Are you sure?」
- ✅「本当にこの応募を不採用にしますか？相手にメッセージが届きます。」

### 通知文

採用：「あなたの応募が**採用**されました 🎉」
不採用：「今回は他の方とご一緒することになりました」（婉曲）
期限：「**◯日までに**◯◯をお願いします」

---

## 6. シニアモード仕様

`html[data-mode="senior"]` の属性切り替えで全体が変化。

| 項目 | 通常 | シニア |
|---|---|---|
| 基本フォントサイズ | 18px | 20px |
| 見出し H4 | 20px | 24px |
| 見出し H3 | 24px | 28px |
| タッチターゲット | 56px | 64px |
| Button SeniorLarge | - | 72px |
| ボディコントラスト | 4.5:1 | 7:1 |
| アニメーション | 通常 | 縮小（200ms以内） |

設定画面（プロフィール内）から切り替え可、ローカルストレージで永続化。

---

## 7. アプリ別の差分

| 要素 | organizer | store | admin |
|---|---|---|---|
| プライマリ色 | Orange | Green | Navy |
| ロゴカラー | Orange アクセント | Green アクセント | Navy単色 |
| アクティブタブ下線 | Orange | Green | Navy |
| 採用バッジ | Orange | Green | （表示のみ） |
| 申請ボタン色 | - | Green | - |
| 承認ボタン色 | Orange | - | - |

**Layout・コンポーネント構造は3アプリで完全に同じ**（既存DESIGN.md方針継承）。

---

## 8. 次の拡張（Phase 2 以降）

| Phase | 追加 |
|---|---|
| **Phase 2** | DatePicker / Combobox / FileUpload / Toast / Alert / EmptyState / Skeleton / Pagination / Breadcrumb / StepIndicator |
| **Phase 3** | FireEquipmentSelector / GeneratorSelector / ApplicationStatusFlow / OrganizerProfileHero |
| **Phase 4** | パターン集（4ステップフォーム / 申請レビューフロー / マッチング状態遷移） |

これらは画面実装と並行で都度追加。最初から完璧を目指さない。

---

## 9. ビジュアル確認

このドキュメントの実物視覚は `design-system.html` で見られる（全15コンポーネント描画済み）。
