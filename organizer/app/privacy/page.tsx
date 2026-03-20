import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">プライバシーポリシー</h1>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">1. 収集する情報</h2>
            <p>当サービスでは、以下の情報を収集する場合があります。</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>氏名、メールアドレス等の個人情報</li>
              <li>団体名、電話番号等の事業者情報</li>
              <li>サービス利用履歴、アクセスログ</li>
              <li>Cookie等を用いた閲覧情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">2. 利用目的</h2>
            <p>収集した情報は、以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>サービスの提供および運営</li>
              <li>ユーザーからのお問い合わせへの対応</li>
              <li>サービスの改善および新機能の開発</li>
              <li>利用規約に違反する行為への対応</li>
              <li>サービスに関するお知らせの送信</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">3. 第三者提供</h2>
            <p>
              当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>サービスの運営上必要な範囲で業務委託先に提供する場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">4. 情報の管理</h2>
            <p>
              当サービスは、ユーザーの個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざんおよび漏洩等の防止に努めます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">5. Cookieの使用</h2>
            <p>
              当サービスでは、ユーザー体験の向上およびサービスの改善のためにCookieを使用しています。
              ブラウザの設定によりCookieを無効にすることも可能ですが、一部のサービスが利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">6. 開示・訂正・削除</h2>
            <p>
              ユーザーは、当サービスが保有する自己の個人情報について、開示・訂正・削除を請求することができます。
              ご請求の際は、お問い合わせフォームよりご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">7. ポリシーの変更</h2>
            <p>
              当サービスは、必要に応じて本ポリシーを変更することがあります。
              変更後のプライバシーポリシーは、当サービス上に掲示された時点から効力を生じるものとします。
            </p>
          </section>

          <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
            最終更新日: 2025年1月1日
          </p>
        </div>
      </div>
    </div>
  );
}
