import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const handler: Handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { items, metadata, successUrl, cancelUrl } = JSON.parse(event.body || '{}');

        if (!items || !Array.isArray(items) || items.length === 0) {
            return { statusCode: 400, body: 'Missing or empty items' };
        }

        // Map frontend items to Stripe line items using ad-hoc pricing ('price_data')
        // This allows us to trust the frontend logic as requested ("Amount... from checkout total")
        // Note: In a real-world scenario, we'd validate against a backend catalog.
        const line_items = items.map((item: any) => ({
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: item.name,
                    description: item.description,
                },
                unit_amount: Math.round(item.amount * 100), // Convert to cents/pence
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: metadata,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ sessionId: session.id }),
        };
    } catch (error: any) {
        console.error('Stripe error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
