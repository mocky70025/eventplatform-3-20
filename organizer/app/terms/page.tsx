import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">利用規約</h1>
        <p className="text-sm text-slate-400 mb-10">最終更新日: 2026年3月1日</p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第1条（適用）</h2>
            <p>
              本規約は、Eventra（以下「当サービス」）が提供するすべてのサービスの利用条件を定めるものです。
              登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って当サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第2条（利用登録）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>登録希望者が当サービスの定める方法によって利用登録を申請し、当サービスがこれを承認することによって、利用登録が完了するものとします。</li>
              <li>当サービスは、以下の場合には利用登録の申請を承認しないことがあります。
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-slate-600">
                  <li>虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当サービスが利用登録を相当でないと判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第3条（ユーザーIDおよびパスワードの管理）</h2>
            <p>
              ユーザーは、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。
              ユーザーIDおよびパスワードの管理不十分、使用上の過誤、第三者の使用等によって生じた損害に関する責任はユーザーが負うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第4条（禁止事項）</h2>
            <p className="mb-3">ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービスの運営を妨害する行為</li>
              <li>他のユーザーに迷惑をかける行為</li>
              <li>他のユーザーの情報を不正に収集する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>当サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第5条（サービスの提供の停止等）</h2>
            <p>
              当サービスは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく
              サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-slate-600">
              <li>サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震、落雷、火災、停電または天災などの不可抗力により提供が困難となった場合</li>
              <li>その他、当サービスが停止を必要と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第6条（利用制限および登録抹消）</h2>
            <p>
              当サービスは、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、
              ユーザーに対して当サービスの全部もしくは一部の利用を制限し、
              またはユーザーとしての登録を抹消することができるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第7条（免責事項）</h2>
            <p>
              当サービスは、サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
              当サービスの利用によりユーザーに生じた損害について、当サービスに故意または重大な過失がある場合を除き、
              一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第8条（サービス内容の変更等）</h2>
            <p>
              当サービスは、ユーザーへの事前の告知をもって、サービスの内容を変更、追加または廃止することがあり、
              ユーザーはこれを承諾するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第9条（利用規約の変更）</h2>
            <p>
              当サービスは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
              変更後の利用規約は、当サービス上に表示した時点から効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第10条（準拠法・裁判管轄）</h2>
            <p>
              本規約の解釈にあたっては、日本法を準拠法とします。
              当サービスに関して紛争が生じた場合には、当サービスの所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
          <p>Eventra</p>
          <Link href="/privacy" className="hover:text-slate-600 transition">
            プライバシーポリシー
          </Link>
        </div>
      </main>
    </div>
  );
}
