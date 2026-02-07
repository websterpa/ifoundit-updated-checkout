import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import * as crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const HANDOFF_SECRET = process.env.HANDOFF_SECRET || 'default-secret-change-me-in-prod-32-chars'; // verify length in prod
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://app.ifoundit.io/claim';

// Encryption Helper (AES-256-GCM)
function encrypt(text: string, secret: string): string {
    // Ensure secret is 32 bytes
    const key = crypto.createHash('sha256').update(String(secret)).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { sessionId } = JSON.parse(event.body || '{}');

        if (!sessionId) {
            return { statusCode: 400, body: 'Missing sessionId' };
        }

        // 1. Verify Session with Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return { statusCode: 400, body: 'Payment not confirmed' };
        }

        // 2. Construct Handoff Payload
        const payload = {
            stripeSessionId: session.id,
            customerEmail: session.customer_details?.email || session.customer_email,
            tagCapacity: session.metadata?.tagCapacity,
            selectedTags: session.metadata?.selectedTags, // JSON string
            freeHaloApplied: session.metadata?.freeHaloApplied,
            timestamp: Date.now()
        };

        // 3. Encrypt Payload
        const token = encrypt(JSON.stringify(payload), HANDOFF_SECRET);

        // 4. Return Redirect URL
        return {
            statusCode: 200,
            body: JSON.stringify({
                handoffUrl: `${MAIN_APP_URL}?token=${token}`
            }),
        };

    } catch (error: any) {
        console.error('Handoff error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
