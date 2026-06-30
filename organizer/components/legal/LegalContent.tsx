// Shared legal copy used by the standalone /terms and /privacy pages and the
// in-app LegalModal. Pure presentational components (no hooks).

export function TermsContent() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Wacca 利用規約</h1>
      <p className="text-sm text-slate-400 mb-8">最終更新日: 2026年4月8日</p>

      <p className="text-slate-700 leading-relaxed mb-8">
        本利用規約（以下「本規約」といいます）は、株式会社Clarity Labo（以下「当社」といいます）が提供するイベントマッチングプラットフォーム「Wacca」（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーは、本規約の全条項に同意した上で本サービスを利用するものとします。
      </p>

      <div className="space-y-8 text-slate-700 leading-relaxed">
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
    </>
  );
}

export function PrivacyContent() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-slate-400 mb-8">最終更新日: 2026年3月1日</p>

      <div className="space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">1. はじめに</h2>
          <p>
            Wacca（以下「当サービス」）は、ユーザーの個人情報の保護を重要視しています。
            本プライバシーポリシーは、当サービスがどのように個人情報を収集、使用、保護するかについて説明します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">2. 収集する情報</h2>
          <p className="mb-3">当サービスは、以下の情報を収集する場合があります。</p>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li><span className="font-medium text-slate-700">アカウント情報:</span> メールアドレス、パスワード、氏名、電話番号</li>
            <li><span className="font-medium text-slate-700">出店者プロフィール情報:</span> 店舗名、業態、ジャンル、住所、紹介文、プロフィール写真</li>
            <li><span className="font-medium text-slate-700">利用情報:</span> アクセスログ、利用履歴、IPアドレス、ブラウザ情報</li>
            <li><span className="font-medium text-slate-700">ソーシャルログイン情報:</span> Google、LINEアカウントから提供される公開プロフィール情報</li>
            <li><span className="font-medium text-slate-700">出店申込情報:</span> 申込内容、提出書類、コミュニケーション履歴</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">3. 情報の利用目的</h2>
          <p className="mb-3">収集した情報は、以下の目的で利用します。</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>サービスの提供・運営・改善</li>
            <li>ユーザーの本人確認</li>
            <li>出店申込の管理・マッチング</li>
            <li>イベント主催者との連絡の仲介</li>
            <li>重要な通知やお知らせの送信</li>
            <li>利用状況の分析およびサービス改善</li>
            <li>不正利用の防止</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">4. 情報の共有</h2>
          <p className="mb-3">当サービスは、以下の場合を除き、個人情報を第三者に提供しません。</p>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li><span className="font-medium text-slate-700">イベント主催者への提供:</span> 出店申込を行った場合、申込に必要な情報（店舗名、業態、連絡先等）をイベント主催者に提供します</li>
            <li><span className="font-medium text-slate-700">法的要請:</span> 法令に基づく開示請求があった場合</li>
            <li><span className="font-medium text-slate-700">ユーザーの同意:</span> ユーザーの事前の同意がある場合</li>
            <li><span className="font-medium text-slate-700">業務委託:</span> サービス運営に必要な範囲で業務委託先に提供する場合（適切な管理監督を行います）</li>
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
          <p className="mt-3">これらの権利を行使する場合は、当サービスのお問い合わせ窓口までご連絡ください。</p>
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
            <p className="font-medium text-slate-700">Wacca サポート</p>
            <p className="mt-1">メール: support@wacca.jp</p>
          </div>
        </section>
      </div>
    </>
  );
}
