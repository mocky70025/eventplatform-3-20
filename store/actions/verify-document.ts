"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";

const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60;
const MAX_BASE64_SIZE = Math.ceil(10 * 1024 * 1024 * 4 / 3);
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function verifyDocument(data: {
    image: string;
    type: "businessLicense" | "vehicleInspection" | "insurance";
}) {
    if (!openai) {
        return { error: "AIサービスの初期化に失敗しました" };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "認証が必要です" };
    }

    // Rate limit
    const admin = createAdminClient();
    const { data: allowed, error: rlError } = await admin.rpc('check_rate_limit', {
        p_key: `verify_doc:${user.id}`,
        p_max_requests: RATE_LIMIT,
        p_window_seconds: RATE_WINDOW_SECONDS,
    });
    if (rlError) {
        return { error: "サーバーエラーが発生しました" };
    }
    if (!allowed) {
        return { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" };
    }

    const { image, type } = data;

    if (!image) {
        return { error: "画像データが必要です" };
    }

    const validTypes = ['businessLicense', 'vehicleInspection', 'insurance'];
    if (!type || !validTypes.includes(type)) {
        return { error: "書類タイプの指定が必要です（businessLicense, vehicleInspection, insurance）" };
    }

    if (image.length > MAX_BASE64_SIZE) {
        return { error: "画像サイズが大きすぎます（最大10MB）" };
    }

    // Extract MIME type and base64 data
    let mimeType = 'image/jpeg';
    let base64Image = image;
    if (image.startsWith('data:')) {
        const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        if (match) {
            if (!ALLOWED_MIME_TYPES.includes(match[1])) {
                return { error: "サポートされていない画像形式です。JPEG, PNG, WebP, GIFのみ対応しています。" };
            }
            mimeType = match[1];
            base64Image = image.split(',')[1];
        }
    }

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
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                ],
            },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) return { error: "AIからの応答が空でした" };

    let result;
    try {
        result = JSON.parse(content);
    } catch {
        return { error: "AIからの応答を解析できませんでした" };
    }

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
        return {
            success: false,
            message: "指定された書類として認識できませんでした。画像を確認してください。",
            confidence: 0.1
        };
    }

    return {
        success: true,
        extractedData,
        message: "AIチェック完了"
    };
}