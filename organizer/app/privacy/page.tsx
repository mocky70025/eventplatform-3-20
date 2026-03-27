import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">Eventra</span>
          </Link>
          <BackButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-slate-400 mb-10">最終更新日: 2026年3月1日</p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. はじめに</h2>
            <p>
              Eventra（以下「当サービス」）は、ユーザーの個人情報の保護を重要視しています。
              本プライバシーポリシーは、当サービスがどのように個人情報を収集、使用、保護するかについて説明します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. 収集する情報</h2>
            <p className="mb-3">当サービスは、以下の情報を収集する場合があります。</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <span className="font-medium text-slate-700">アカウント情報:</span> メールアドレス、パスワード、氏名、電話番号
              </li>
              <li>
                <span className="font-medium text-slate-700">主催者プロフィール情報:</span> 団体名、業種、住所、紹介文、プロフィール写真
              </li>
              <li>
                <span className="font-medium text-slate-700">利用情報:</span> アクセスログ、利用履歴、IPアドレス、ブラウザ情報
              </li>
              <li>
                <span className="font-medium text-slate-700">ソーシャルログイン情報:</span> Google、LINEアカウントから提供される公開プロフィール情報
              </li>
              <li>
                <span className="font-medium text-slate-700">イベント情報:</span> イベント内容、出店者との連絡履歴
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. 情報の利用目的</h2>
            <p className="mb-3">収集した情報は、以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>サービスの提供・運営・改善</li>
              <li>ユーザーの本人確認</li>
              <li>イベントの管理・出店者とのマッチング</li>
              <li>出店者との連絡の仲介</li>
              <li>重要な通知やお知らせの送信</li>
              <li>利用状況の分析およびサービス改善</li>
              <li>不正利用の防止</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. 情報の共有</h2>
            <p className="mb-3">当サービスは、以下の場合を除き、個人情報を第三者に提供しません。</p>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
              <li>
                <span className="font-medium text-slate-700">出店者への提供:</span> イベントへの申込があった場合、主催者の連絡先情報を出店者に提供します
              </li>
              <li>
                <span className="font-medium text-slate-700">法的要請:</span> 法令に基づく開示請求があった場合
              </li>
              <li>
                <span className="font-medium text-slate-700">ユーザーの同意:</span> ユーザーの事前の同意がある場合
              </li>
              <li>
                <span className="font-medium text-slate-700">業務委託:</span> サービス運営に必要な範囲で業務委託先に提供する場合（適切な管理監督を行います）
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. データの保管とセキュリティ</h2>
            <p>
              当サービスは、ユーザーの個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざんおよび漏洩等を防止するため、
              合理的な技術的・組織的なセキュリティ対策を講じます。データは暗号化された通信（SSL/TLS）を通じて送受信され、
              安全なクラウドインフラストラクチャ上に保管されます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Cookieの使用</h2>
            <p>
              当サービスは、ユーザー体験の向上、認証の維持、利用状況の分析のためにCookieを使用します。
              ユーザーはブラウザの設定によりCookieの受け入れを拒否できますが、
              一部のサービス機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. ユーザーの権利</h2>
            <p className="mb-3">ユーザーは、自己の個人情報について以下の権利を有します。</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>個人情報の開示を求める権利</li>
              <li>個人情報の訂正・追加・削除を求める権利</li>
              <li>個人情報の利用停止を求める権利</li>
              <li>アカウントの削除を求める権利</li>
            </ul>
            <p className="mt-3">
              これらの権利を行使する場合は、当サービスのお問い合わせ窓口までご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. 未成年者の利用</h2>
            <p>
              当サービスは、18歳未満の方の利用を想定していません。
              18歳未満の方が当サービスを利用する場合は、保護者の同意が必要です。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. ポリシーの変更</h2>
            <p>
              当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。
              重要な変更がある場合は、サービス上での通知またはメールにてお知らせします。
              変更後のポリシーは、当サービス上に掲載した時点から効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは、当サービスのお問い合わせフォームまたは以下の連絡先までお願いいたします。
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
              <p className="font-medium text-slate-700">Eventra サポート</p>
              <p className="mt-1">メール: support@eventra.jp</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
          <p>Eventra</p>
          <Link href="/terms" className="hover:text-slate-600 transition">
            利用規約
          </Link>
        </div>
      </main>
    </div>
  );
}
