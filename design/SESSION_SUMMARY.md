# Wacca デザインセッションまとめ（2026-05-28）

> 次セッションへの引き継ぎ文書。`/clear` 後でもこのMDを読めば現状把握できる。

---

## 1. プロダクト前提

- **サービス名**: Wacca（ワッカ）
- **運営**: 株式会社 Clarity Labo
- **コンセプト**: 主催者と出店者（キッチンカー等）のマッチングプラットフォーム
- **3アプリ構成**: organizer / store / admin（すべてWebアプリ、LINE案は破棄済み）
- **ターゲット**: 個人〜小規模の主催者・出店者、シニア対応含む
- **ビジネスモデル**: 主催者課金（紹介数 × 日数 × 単価）

詳細: `design/00-current-state.md`, `04-concept-wacca.md`, `02-personas.md`, `03-cjm.md`

---

## 2. デザインシステム（Figmaファイル）

**Figmaファイル**: `https://www.figma.com/design/UcokAr3J9G42Jw3TCneCvm/Wacca`
**fileKey**: `UcokAr3J9G42Jw3TCneCvm`

### ページ構成（2ページ）

```
📄 Dashboards / Mockups   ← ダッシュボードのモック（v1〜v3）
📄 Design System          ← トークン + コンポーネント
```

### Design System ページの中身

```
🎨 Wacca Design System（共通）
├─ Foundation
│  ├─ 01 カラーパレット（6グループ・25トークン）
│  │   Sumi / Cream / Neutral / Semantic / Gold / White
│  │   ※ Orange/Greenは下のアプリ別セクションに分離
│  ├─ 02 タイポグラフィ（Noto Sans JP・9段）
│  ├─ 03 スペーシング（13段）
│  ├─ 04 角丸（5段）
│  └─ 05 影（4段）
└─ Components（実画面で使用中の5つだけ）
    ├─ Common / TopNav
    ├─ Common / SectionHeader
    └─ Common / TodoListItem（Urgent / Normal / Done の3バリアント）

🟠 Organizer Design System
├─ Foundation: Orange パレット 8階調
└─ Components: ApplicationReviewCard / EmptyState (No Applications)

🟢 Store Design System
├─ Foundation: Green パレット 8階調
└─ Components:
   ├─ 01 Store / MyApplicationCard（採用 / 審査中 / 補欠 の3バリアント）
   ├─ 02 Store / TopNav（Wacca + ダッシュボード/イベントを探す/応募状況/メッセージ）
   └─ 03 Store / SectionHeader（タイトル + 件数バッジ + すべて見るリンク）
```

### 設計原則（厳格に守られている）

1. **コンポーネント = 実画面で使われているもの**だけ存在する
2. 未使用コンポーネントは即削除
3. インライン（直書き）パーツも実画面で使うならコンポーネント化する

→ 過去に57個のコンポーネントを作ったが、未使用品を削除して今は**5個だけ**残っている。

---

## 3. ダッシュボードの状態

### Organizer Dashboard 3バリアント

「Dashboards / Mockups」ページに横並びで配置：

| バージョン | ID | 状態 | 高さ | 説明 |
|---|---|---|---|---|
| **v1** | `47:2` | 手組み版（旧） | 〜 | 参考用、コンポーネント未使用 |
| **v2** | `162:3` | 通常 | 774px | 応募8件あり |
| **v2-empty** | `205:182` | 応募ゼロ・イベントも未作成 | 〜 | EmptyState 表示 |
| **v3** | `221:303` | イベント作成済み・応募者ゼロ | 〜 | TODO がプロモーション系 |

### Store Dashboard

| バージョン | ID | 状態 | 高さ | 説明 |
|---|---|---|---|---|
| **v1** | `257:365` | 通常 | 811px | 出店者向け。Green系。応募3件（採用/審査中/補欠） + TODO 6件（急ぎ3/通常3） |

### 各ダッシュボードの構造（v2-v3共通）

```
┌─────────────────────────────────────────────┐
│ TopNav（Wacca + メニュー4項目 + 通知 + Avatar）│
├─────────────────────────────────────────────┤
│ 最近の応募 [新着 N件] ─── すべて見る →        │
│   ┌─────┐ ┌─────┐ ┌─────┐              │
│   │     │ │     │ │     │  ← 3枚カード      │
│   └─────┘ └─────┘ └─────┘              │
├─────────────────────────────────────────────┤
│ 今日のTODO [6件・3件 急ぎ] ─── 全てを見る →  │
│   ┌─────────┬──────────┐               │
│   │ ☐ 急ぎ1 │ ☐ 通常1   │ ← 2列レイアウト │
│   │ ☐ 急ぎ2 │ ☐ 通常2   │                 │
│   │ ☐ 急ぎ3 │ ☐ 通常3   │                 │
│   └─────────┴──────────┘               │
└─────────────────────────────────────────────┘
```

スクロール不要で全部見える設計（高さ約 770-810px）。

### 重要な設計判断（履歴）

- ❌ Hero（カウントダウン+カレンダー）を一度入れたが**削除**
- ❌ 「分析と最近の活動」（ChartCard + TimelineEvent）を**削除**
- ❌ 「今月の活動状況」（MetricCards）を**削除**
- ✅ 残ったのは「最近の応募」と「今日のTODO」だけ。これで主催者が朝開いた瞬間に対応すべきことが全部見える。
- ✅ TODOは2列レイアウトで6件全部表示

---

## 4. TODO リストのアルゴリズム（仕様確定済み）

### 6種類の自動検知ソース

| # | TODO | 検知ロジック（疑似コード） | 緊急判定 |
|---|---|---|---|
| 1 | 新規申請を確認 | `applications.where(status: 'pending', organizer: me).count()` | 3日以上未対応 or 5件以上で急ぎ |
| 2 | 書類の期限切れ対応 | `documents.where(expires_at: <30日, status: 'unaddressed')` | 14日以内で急ぎ |
| 3 | 募集締切が近い | `events.where(application_deadline: <14日, slots_remaining > 0)` | 3日以内で急ぎ |
| 4 | チャット未読 | `messages.where(read: false).count()` | 24h以上未読で急ぎ |
| 5 | 当日情報の未共有 | `events.where(event_date: <7日, meeting_info_sent: false)` | 3日以内で急ぎ |
| 6 | 未入金の出店料 | `applications.where(status: 'accepted', payment: 'pending')` | 7日以内で急ぎ |

### サーバーAPI設計

```
GET /api/organizer/dashboard/todos
Response: {
  todos: [{ id, type, urgent, title, meta, badge, action: {label, route}, count }],
  totalCount: 6,
  urgentCount: 3,
}
```

### ソート

1. urgent → normal
2. urgent内は時間切迫度（日数少ない順）
3. 同切迫度なら件数多い順

### 表示制限

- ダッシュボードでは最大6件（2列×3行）
- 7件目以降は「全てを見る →」で `/todos` ページ

### チェックボックスの扱い

UI上の `☐` は装飾的。実際の操作は右の「アクション」ボタン（確認 / 依頼 / 編集 など）。完了したTODOは次回サーバーが返さないことで自然消滅。

---

## 5. ファイル構成

### `eventplatform/design/` 配下

```
design/
├── 00-current-state.md            # 現状把握（v2、資料準拠）
├── 01-business-model.md           # ビジネスモデル
├── 02-personas.md                 # ペルソナ6名（抽象化）
├── 03-cjm.md                      # CJM As-is/To-Be
├── 04-concept-wacca.md            # コンセプトシート
├── 05-feature-requirements.md     # 機能要件サマリー
├── design-system.md               # デザインシステム v1.0仕様書
├── design-system.html             # デザインシステム ビジュアル（古い、参考）
├── dashboard-alternatives.html    # 旧3案カタログ（参考）
├── dashboard-catalog.html         # 旧8案カタログ（参考）
├── tokens.css                     # Tailwind v4 @theme 形式トークン
└── SESSION_SUMMARY.md             # このファイル
```

### `design-v1-archive/`

旧版（仮想ペルソナベース）が保管されている。今は参照しない。

### コードリポジトリ

```
eventplatform/
├── organizer/   # Next.js 16 主催者向けWebアプリ
├── store/       # Next.js 16 出店者向けWebアプリ
├── admin/       # Next.js 16 運営者向けWebアプリ
└── supabase/    # DB
```

最新のVercelデプロイ：
- organizer: `eventra-organizer.vercel.app`（または `event1-27-organizer.vercel.app` 等）
- store: `eventra-store.vercel.app`
- admin: `eventra-admin.vercel.app`

---

## 6. 次にやるべきこと（優先度順・具体的）

> 上から順に取り組むと自然に繋がる。

### ✅ 完了済み（直近セッション）

#### Task 1.1：Store ダッシュボードを作る — **完了 2026-05-28**

- Dashboards / Mockups ページ、`x=6400, y=0` に「Store Dashboard v1」(`257:365`) を配置
- 高さ 811px、スクロール不要
- 新規 3 コンポーネントを Store Design System に追加（**全てコンポーネント化済み、ダッシュボード側はインスタンスのみ**）:
  - `Store / MyApplicationCard` (`263:398`) — バリアント「状態」: 採用 / 審査中 / 補欠
  - `Store / TopNav` (`275:455`) — Logo + メニュー + 通知 + Avatar
  - `Store / SectionHeader` (`277:472`) — タイトル + 件数バッジ + すべて見るリンク
- TODOは Common/TodoListItem を流用、2列×3行（急ぎ左／通常右）

**残課題**:
- カードのイメージ帯は green グラデのプレースホルダー。実画像枠への差し替えは実装時に検討
- 将来的に `Common / TopNav` と `Common / SectionHeader` に theme=Organizer/Store バリアントを追加して Store 専用を統合する余地あり（現状は別コンポーネント運用）

---

### 🥇 Priority 1（次セッションで最初にやる）

#### Task 1.2：TODO API エンドポイントを実装

Organizer dashboard を実装する前に、データソースを用意。

**ファイル**: `eventplatform/organizer/app/api/dashboard/todos/route.ts`

**実装内容**（SESSION_SUMMARY.md セクション4のロジック）：
```ts
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const todos = [];
  
  // 1. 新規申請
  const pendingApps = await db.applications.count({ status: 'pending', organizer: user.id });
  if (pendingApps > 0) todos.push({ ... });
  
  // 2. 書類期限切れ
  // 3. 募集締切
  // 4. チャット未読
  // 5. 当日情報未共有
  // 6. 未入金
  
  // ソート: urgent → normal → 切迫度 → 件数
  todos.sort(...);
  
  return Response.json({ todos, totalCount, urgentCount });
}
```

**Supabaseクエリ例**（参考）：
```ts
const { count } = await supabase
  .from('applications')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending')
  .eq('organizer_id', user.id);
```

---

### 🥈 Priority 2（次々セッション）

#### Task 2.1：Organizer ダッシュボード実装

Figma の v2 を実コードに落とす。

**ファイル**: `eventplatform/organizer/app/(main)/page.tsx`

**手順**：
1. `tokens.css` を `eventplatform/organizer/app/globals.css` に取り込む
2. TopNav, SectionHeader, TodoListItem, ApplicationReviewCard を React 化（`components/ui/` 配下）
3. ダッシュボードページ：
   - 上記API から TODO を fetch
   - 同様に `/api/dashboard/applications/recent` で最近の応募取得
   - レイアウトは Figma 通り

**確認**: `qa-local` スキルで localhost:3002 を実機確認

#### Task 2.2：個別画面のデザイン（Organizer）

ダッシュボードから遷移する画面を順次設計：
1. **応募一覧画面** `/applications`
   - フィルター（ステータス、イベント別）
   - 大量データを一覧表示（テーブル or カードリスト）
2. **応募詳細画面** `/applications/[id]`
   - 出店者プロフィール詳細、書類確認、承認/却下
3. **イベント作成フォーム** `/events/new`
   - 4ステップ（Step1: 情報 / Step2: 規約 / Step3: 質問 / Step4: 確認）
   - 火気機材・発電機の構造化入力含む

各画面でも「コンポーネント先行 NG」を守る。実画面で使うものだけ Figma にコンポーネント化。

---

### 🥉 Priority 3（後段）

#### Task 3.1：個別画面のデザイン（Store）
1. **イベント検索画面** `/events`
2. **イベント詳細画面** `/events/[id]`
3. **出店申請フォーム** `/events/[id]/apply`
4. **マイプロフィール** `/profile`（書類アップロード、写真ギャラリー含む）
5. **応募状況一覧** `/applications`

#### Task 3.2：モバイル対応
現在 PC 1440px。スマホ対応は別ブレークポイントで設計。Figma のフレームを `375px` 幅で複製、再構成。

#### Task 3.3：ロゴ実制作
SESSION_SUMMARY 言及の3案（Trust Loop / Community Loop / Universal Loop）から1案を実制作。

---

### 🛠 Priority 4（実装の続き）

#### Task 4.1：tokens.css 実適用
全アプリの `globals.css` に `@import "../../design/tokens.css"` で取り込み、Tailwind v4 で利用可能に。

#### Task 4.2：shadcn-style 共通コンポーネント実装
Figma にあるコンポーネントを React で実装：
- `components/ui/top-nav.tsx`
- `components/ui/section-header.tsx`
- `components/ui/todo-list-item.tsx`
- `components/ui/application-review-card.tsx`
- `components/ui/empty-state.tsx`

各コンポーネントは Figma 定義に従う（props interface はそのまま）。

#### Task 4.3：QAテスト・運用準備
- `qa-local` スキルで実機ブラウザテスト
- 利用規約・プライバシーポリシー最終化
- ドメイン `wacca.xyz` 接続（DNS 設定、Vercel）

---

## 7. 次セッション開始時のおすすめ手順

1. このファイル `SESSION_SUMMARY.md` を最初に読む
2. Figmaファイル開いて現状を視覚的に確認（fileKey: `UcokAr3J9G42Jw3TCneCvm`）
3. **Task 1.2（TODO API 実装）から着手** — Store ダッシュボードは Figma 完成済み
4. 完了したらこのファイルの「次にやるべきこと」を更新

---

---

## 8. 重要な決まりごと（このプロジェクトで守るルール）

1. **コンポーネント先行 NG**：実画面で使ってから作る。未使用は即削除
   - 補強ルール（2026-05-29 追加）：**実画面で 1 度でも作ったパーツは必ずコンポーネント化を挟む**。インラインで終わらせない
2. **ブランド色は Sumi（墨）× Orange × Green × Cream**：Orange=主催者、Green=出店者
3. **タイポは Noto Sans JP のみ**（本文 18px、シニア対応 20px）
4. **角丸は 12px デフォルト**（rounded-xl）
5. **影は弱め**（opacity 0.06〜0.10）
6. **emoji 禁止、カタカナ用語回避**
7. **PC-first（1440px）**、モバイルは後段

---

## 9. 直近の重要決定

- **ヘッダー＆KPI＆分析全削除** → 朝開いて重要な2つだけ：応募 + TODO
- **TODOは2列**、急ぎ左／通常右 で6件全部一目で見える
- **アバター（イニシャル）は不要** → 写真と店名で識別
- **オレンジドット削除** → 急ぎ印はチェックボックス枠色＋バッジで表現
- **ヒーローは Cream/Orange-100 ベースで Sumi に戻らない**（調和優先）

---

最終更新: 2026-05-29（Store Dashboard v1 完成時点）
