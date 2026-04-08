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
            <span className="text-lg font-bold text-slate-900">Wacca</span>
          </Link>
          <BackButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Wacca 利用規約</h1>
        <p className="text-sm text-slate-400 mb-10">最終更新日: 2026年4月8日</p>

        <p className="text-slate-700 leading-relaxed mb-10">
          本利用規約（以下「本規約」といいます）は、株式会社Clarity Labo（以下「当社」といいます）が提供するイベントマッチングプラットフォーム「Wacca」（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーは、本規約の全条項に同意した上で本サービスを利用するものとします。
        </p>

        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第1条（本サービスの性質と当社の役割）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本サービスは、イベントを主催する「主催者」と、出店を希望する「出店者」に対し、マッチングの場および情報提供を行うプラットフォームです。</li>
              <li>当社は、マッチングの機会を提供するのみであり、主催者と出店者の間で成立する出店契約、売買契約その他の合意（以下「個別契約」といいます）の当事者ではありません。</li>
              <li>個別契約に基づく出店料の支払い、設営、運営、撤収、清掃、および金銭の授受に関する一切の事項は、当事者間で直接遂行するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第2条（免責事項の徹底）</h2>
            <p className="mb-3">当社は、以下の事項について、理由の如何を問わず、また予見可能性の有無を問わず、一切の責任（法的責任、道義的責任を含む）を負わないものとします。</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>イベント現場で発生した事故、負傷、食中毒、感染症の発生、盗難、器物破損、紛失、停電、断水等の一切のトラブル。</li>
              <li>天災地変、悪天候、行政指導、テロ、暴動、交通機関の乱れ等によるイベントの中止、延期、または内容の変更。</li>
              <li>主催者または出店者による個別契約の不履行、不当なキャンセル（ドタキャン）、連絡不通、および出店料の未払い。</li>
              <li>ユーザーが本サービスに登録した情報の正確性、真実性、最新性。</li>
              <li>ユーザー間で生じた全ての紛争。これらはユーザーの責任と費用において解決するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第3条（損害賠償の制限）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>万が一、裁判所の確定判決等により当社がユーザーに対し損害賠償責任を負う場合であっても、当社の賠償責任は、直接かつ現実に生じた通常の損害に限られるものとし、その賠償額の総額は、金1,000円（消費税込）を上限とします。</li>
              <li>当社は、ユーザーの逸失利益、間接損害、特別損害、弁護士費用については、一切賠償する責任を負わないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第4条（反社会的勢力の排除と即時解除）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>ユーザーは、現在および将来にわたって、暴力団員、暴力団関係企業等の反社会的勢力に該当しないこと、および暴力的な要求行為等を行わないことを表明し、保証します。</li>
              <li>ユーザーが本条に違反した、またはその疑いがあると当社が判断した場合、当社は事前の通知なく直ちにアカウントを削除し、本サービスの利用を永久に停止できるものとします。これによりユーザーに損害が生じても、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第5条（個人情報の開示と守秘義務）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>ユーザーは、マッチング成立（主催者による承認）の際、円滑な取引遂行を目的として、相手方ユーザーに対し、自身の氏名（担当者名）、メールアドレス、電話番号、および登録情報が開示されることに同意するものとします。</li>
              <li>ユーザーは、本サービスを通じて得た相手方の個人情報を、当該イベントの遂行目的以外に使用してはならず、第三者に漏洩してはならないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第6条（コンテンツの権利と二次利用）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>ユーザーが本サービスに掲載した画像、テキスト等の著作権はユーザーに帰属しますが、当社はこれらを本サービスの広告宣伝、実績紹介（SNS、ウェブサイト、印刷物等）のために、無償かつ無期限に利用（改変、転載、複製等）できるものとし、ユーザーはこれに同意します。</li>
              <li>ユーザーは、投稿内容が第三者の知的財産権を侵害していないことを保証し、侵害に関連する紛争が生じた場合は自己の責任で解決するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第7条（評価・レビューの管理）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>当社は、ユーザーによる評価やコメントの内容が、誹謗中傷、虚偽、営業妨害、その他不適切であると独自の判断に基づき判断した場合、事前の通知なく当該投稿を削除または変更できる権利を有します。</li>
              <li>ユーザーは、投稿された評価結果を理由に、当社に対して損害賠償請求や不服申し立てを行うことはできないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第8条（サービスの停止・変更・終了）</h2>
            <p>
              当社は、システムの保守、不可抗力、または当社の経営判断により、ユーザーに事前に通知することなく本サービスの内容を変更し、または一時中断・終了できるものとします。これに伴いユーザーに生じた不利益について、当社は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">第9条（準拠法および専属的合意管轄）</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本規約の解釈および適用にあたっては、日本法を準拠法とします。</li>
              <li>本サービスまたは本規約に関して紛争が生じた場合には、当社の本店所在地を管轄する地方裁判所（静岡地方裁判所 沼津支部 等）を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
          <p>Wacca</p>
          <Link href="/privacy" className="hover:text-slate-600 transition">
            プライバシーポリシー
          </Link>
        </div>
      </main>
    </div>
  );
}
