# Redesign 実装計画・進捗（redesign ブランチ）

最終更新: 2026-06-07（夜間自動作業）

## 0. 安全な土台（完了）
- `redesign` ブランチ作成・push 済み（`main`＝本番は無傷）
- Vercel が3アプリのプレビューを自動生成:
  - store: `eventra-store-git-redesign-mocky700s-projects.vercel.app`
  - organizer: `eventra-organizer-git-redesign-mocky700s-projects.vercel.app`
  - admin: `eventra-admin-git-redesign-mocky700s-projects.vercel.app`
- 完成後は `redesign → main` マージで本番化（ロールバック容易）

## 1. 重要な前提（夜間点検の結論）
このセッションで「Figmaをコードに合わせる」作業をしたため、**コードとFigmaは約8割すでに一致**している。
「全面刷新の大きな未実装差分」は存在しない。残差は下記2種類のみ。

- (A) 主観的な見た目の微差 … 稼働中の機能に触るため、勝手に変えると壊す/意図違いのリスク → 要確認
- (B) 未確定の複数デザイン案 … 正式案を選ぶ必要 → 要判断

→ 夜間は憶測実装を避け、本書（計画）を残す。安全に断定できる範囲のみ後述「実施済み」に記載。

## 2. 画面マッピング（Figma ↔ コード ルート）

### Store（出店者）
| ルート | Figma画面 | 状態 |
|---|---|---|
| `/login` `/signup` | Store Login/Signup | ✅ 一致（Google/規約注記まで反映済み） |
| `/forgot-password` `/reset-password` `/signup/verify-email` | あり | ✅ 一致想定（要軽点検） |
| `/terms` `/privacy` | Store Terms/Privacy | ✅ 一致（実法的文言入り） |
| `/onboarding` | Store Onboarding 店舗情報 | ✅ 1ページ構成で一致 |
| `/` (Dashboard) | **Store Dashboard v1** | ⚠️(B) 内容未確定 |
| `/events` | Store Browse Events | △(A) 文言「イベント検索↔探す」/ フィルタ select↔chips |
| `/events/[id]` | Store Event Detail | △ 要視覚点検 |
| `/events/[id]/apply` | Store Apply Form | △ 要視覚点検 |
| `/applications` | Store My Applications | △ 要視覚点検 |
| `/applications/[id]` | Store Application Detail | △ 要視覚点検 |
| `/history` | Store History | △ 要視覚点検 |
| `/notifications` | Store Notifications | ✅ ナビ→ベル導線は反映済み |
| `/organizers/[id]` | Store - Organizer Public Profile | △ 要視覚点検 |
| `/profile` | Store Profile | ✅ サイドバータブ構成で一致 |

### Organizer（主催者）
| ルート | Figma画面 | 状態 |
|---|---|---|
| auth系 / `/terms` `/privacy` / `/onboarding` / `/profile` | 各対応 | ✅ 一致（storeと同様） |
| `/` (Dashboard) | **Organizer Dashboard v2(Components) / v3 / Empty State** | ⚠️(B) **複数案・未確定**。TODOリスト案が有力（todos API実装済み）だが要決定 |
| `/applications` | **Applications v1(表) / v2(カードグリッド) / Lightbox** | ⚠️(B) 表 or カードグリッド どちらを正式にするか要決定 |
| `/events` `/events/[id]` `/events/new` `/events/[id]/edit` `/events/[id]/applications` | 各対応 | △ 要視覚点検 |
| `/exhibitors/[id]` | Organizer Exhibitor Profile | △ 要視覚点検 |
| `/notifications` | あり | ✅ ナビ→ベル反映済み |

### Admin（管理者）
| ルート | Figma画面 | 状態 |
|---|---|---|
| `/login` | Admin Login | ✅ 一致（ソーシャルなし） |
| `/` `/events` `/exhibitors` `/organizers` | Admin各画面 | ✅ ナビをコード順に整合済み。中身は △ 要視覚点検 |

## 3. 起きたら決めてほしいこと（これが実装の前提＝ブロッカー）
1. **Organizer ダッシュボード**: v2 / v3 / Empty のどれを正式に？（TODOリスト中心で進める？）
2. **Store ダッシュボード**: v1 で確定？内容は？
3. **Organizer 応募一覧**: 表(v1) と カードグリッド(v2) どちらを正式に？Lightbox（原寸表示）は採用する？
4. **イベント検索のフィルタUI**: 現状の select 式のままか、Figmaの chips/tab 式に作り替えるか（後者は機能再実装が必要）
5. **文言**: 「イベント検索」↔「イベントを探す」など、Figma文言に合わせてよいか（全画面の細かい文言を正とするか）

→ 1つでも決まれば、その画面から redesign ブランチで実装→プレビュー確認→朝レビュー、で進められる。

## 4. 夜間に実施したこと
- redesign ブランチ整備・プレビュー稼働確認
- Figma全画面 × 全ルートの棚卸し（本書）
- terms/privacy・auth・nav の一致を確認（追加実装不要と判定）
- ※ 稼働中アプリを壊す/意図と違う改修を避けるため、(A)(B)の実装は保留（判断待ち）

## 5. 推奨の進め方（朝以降）
1. §3の決定 → 画面単位で「Figma=正」で実装
2. 1画面ごとに redesign に push → プレビューURLで確認 → OKなら次へ
3. 全画面OK後、`redesign → main` をマージして本番化
