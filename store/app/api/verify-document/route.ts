import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Initialize OpenAI correctly
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey: apiKey }) : null;

const RATE_LIMIT = 5; // max requests per window
const RATE_WINDOW_SECONDS = 60; // 1 minute

export async function POST(req: Request) {
    try {
        if (!openai) {
            return NextResponse.json({ error: "AIサービスの初期化に失敗しました" }, { status: 500 });
        }

        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
        }

        // Rate limit check (distributed via Supabase)
        const supabaseAdmin = createAdminClient();
        const { data: allowed, error: rlError } = await supabaseAdmin.rpc('check_rate_limit', {
            p_key: `verify_doc:${user.id}`,
            p_max_requests: RATE_LIMIT,
            p_window_seconds: RATE_WINDOW_SECONDS,
        });
        if (rlError) {
            return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
        }
        if (!allowed) {
            return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再試行してください。" }, { status: 429 });
        }

        const { image, type } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "画像データが必要です" }, { status: 400 });
        }

        const validTypes = ['businessLicense', 'vehicleInspection', 'insurance'];
        if (!type || !validTypes.includes(type)) {
            return NextResponse.json({ error: "書類タイプの指定が必要です（businessLicense, vehicleInspection, insurance）" }, { status: 400 });
        }

        // Validate image size (base64 is ~33% larger than raw, so 13.4MB base64 ≈ 10MB raw)
        const MAX_BASE64_SIZE = Math.ceil(10 * 1024 * 1024 * 4 / 3);
        if (image.length > MAX_BASE64_SIZE) {
            return NextResponse.json({ error: "画像サイズが大きすぎます（最大10MB）" }, { status: 400 });
        }

        // Extract MIME type and base64 data from data URL
        let mimeType = 'image/jpeg';
        let base64Image = image;
        if (image.startsWith('data:')) {
            const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
            if (match) {
                mimeType = match[1];
                base64Image = image.split(',')[1];
            }
        }

        // Determine prompts based on document type
        const systemPrompt = "あなたは日本の公的書類を読み取るAIアシスタントです。提供された画像から必要な情報をJSON形式で抽出してください。";
        let userPrompt = "";

        if (type === 'businessLicense') {
            userPrompt = "この画像は「飲食店営業許可証」のはずです。1. 書類の種類が飲食店営業許可証かどうか判定してください。2. 有効期限を探してください。JSON形式で { \"isBusinessLicense\": boolean, \"expiryDate\": \"YYYY-MM-DD\" } を返してください。有効期限が読み取れない場合はnullにしてください。";
        } else {
            userPrompt = "この画像は「車検証」または「保険証券」のはずです。書類の種類を特定し、有効期限があれば抽出してください。JSON形式で { \"documentType\": string, \"expiryDate\": \"YYYY-MM-DD\" } を返してください。";
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ],
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 300,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("AIからの応答が空でした");

        let result;
        try {
            result = JSON.parse(content);
        } catch {
            return NextResponse.json({ error: "AIからの応答を解析できませんでした" }, { status: 500 });
        }

        // Standardize output
        let extractedData = {
            documentType: "",
            expiryDate: "",
            verified: false
        };

        if (type === 'businessLicense') {
            extractedData.documentType = result.isBusinessLicense ? "飲食店営業許可証" : "不明な書類";
            extractedData.expiryDate = result.expiryDate;
            extractedData.verified = result.isBusinessLicense;
        } else {
            extractedData.documentType = result.documentType || "不明";
            extractedData.expiryDate = result.expiryDate;
            extractedData.verified = !!result.documentType;
        }

        if (!extractedData.verified) {
            return NextResponse.json({
                success: false,
                message: "指定された書類として認識できませんでした。画像を確認してください。",
                confidence: 0.1
            });
        }

        return NextResponse.json({
            success: true,
            extractedData,
            message: "AIチェック完了"
        });

    } catch (error: any) {
        return NextResponse.json({ error: "AIチェック中にエラーが発生しました" }, { status: 500 });
    }
}
