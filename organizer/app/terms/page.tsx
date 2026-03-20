import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

        <h1 className="text-2xl font-bold text-slate-900 mb-8">利用規約</h1>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第1条（適用）</h2>
            <p>
              本規約は、Eventra（以下「当サービス」）の利用に関する条件を定めるものです。
              登録ユーザーの皆さまには、本規約に従って当サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第2条（利用登録）</h2>
            <p>
              登録希望者が当サービスの定める方法によって利用登録を申請し、当サービスがこれを承認することによって、利用登録が完了するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第3条（アカウント管理）</h2>
            <p>
              ユーザーは、自己の責任において、アカウントのメールアドレスおよびパスワードを適切に管理するものとします。
              ユーザーは、いかなる場合にも、アカウントを第三者に譲渡または貸与することはできません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第4条（禁止事項）</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービスの運営を妨害する行為</li>
              <li>他のユーザーに迷惑をかける行為</li>
              <li>不正アクセスを試みる行為</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第5条（サービスの提供停止）</h2>
            <p>
              当サービスは、以下の事由があると判断した場合、ユーザーに事前に通知することなくサービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>サービスにかかるシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災等の不可抗力により、サービスの提供が困難となった場合</li>
              <li>その他、当サービスがサービスの提供が困難と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第6条（免責事項）</h2>
            <p>
              当サービスは、サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
              当サービスの利用により生じた損害について、当サービスは一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">第7条（規約の変更）</h2>
            <p>
              当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
              変更後の利用規約は、当サービス上に掲示された時点から効力を生じるものとします。
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
