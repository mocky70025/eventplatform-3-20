import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || "Wacca <noreply@wacca.xyz>";

export async function sendNotificationEmail(params: {
    to: string;
    subject: string;
    html: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        return;
    }

    try {
        await resend.emails.send({
            from: FROM_ADDRESS,
            to: params.to,
            subject: params.subject,
            html: params.html,
        });
    } catch {
        // Email delivery is non-critical; swallow failures.
    }
}
