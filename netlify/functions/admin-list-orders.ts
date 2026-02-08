
import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'test-secret';

// Duplicated config to avoid import issues
const CAPACITY_CONFIG: Record<number, { label: string }> = {
    1: { label: "Essential Plan" },
    3: { label: "Up to 3 tags" },
    10: { label: "Up to 10 tags" },
    20: { label: "Up to 20 tags" },
};

export const handler: Handler = async (event, context) => {
    // 1. Access Control
    const clientSecret = event.headers['x-admin-secret'];
    if (clientSecret !== ADMIN_SECRET) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        const query = event.queryStringParameters?.q;
        let sessions: Stripe.ApiListPromise<Stripe.Checkout.Session>;

        if (query) {
            // SEARCH MODE
            // Stripe Search API supports query language
            // metadata['tagCapacity']:'10' check? No, user wants ID search.
            // Searchable fields: email, name, metadata, payment_intent, etc.
            // Note: sessions.search is available in newer APIs.
            // Let's try flexible search
            const searchString = `status:'complete' AND (email~'${query}' OR metadata['orderId']:'${query}')`;
            // Actually, Stripe Session Search is limited.
            // Better to search PaymentIntents if we have a PID?
            // Or just list and filter in memory if volume is low (PROTOTYPE ONLY).
            // BUT prompt says "Support Search Index". 
            // Since we don't have a DB, "Stripe Search" is the index.
            // Let's implement basic List + Filter for now as fallback, or use search if available.
            // Stripe API `search` on checkout sessions is: stripe.checkout.sessions.search({ query: ... })

            // Construct query for Stripe Search syntax
            // Supports: status, payment_intent, email...
            // Syntax: "email~'bob@example.com' OR payment_intent:'pi_123'"

            const stripeQuery = `status:'complete' AND (customer_email~"${query}" OR payment_intent:"${query}")`;

            // Note: Order ID is usually the Session ID (cs_test_...).
            // If query starts with cs_, look up directly?
            if (query.startsWith('cs_')) {
                const session = await stripe.checkout.sessions.retrieve(query, {
                    expand: ['payment_intent', 'payment_intent.latest_charge']
                });
                // Wrap as list
                sessions = Promise.resolve({ data: [session], has_more: false, object: 'list', url: '' });
            } else {
                // Use Search API
                sessions = stripe.checkout.sessions.search({
                    query: stripeQuery,
                    limit: 20,
                    expand: ['data.payment_intent', 'data.payment_intent.latest_charge']
                });
            }
        } else {
            // LIST MODE (Recent)
            sessions = stripe.checkout.sessions.list({
                limit: 20,
                expand: ['data.payment_intent', 'data.payment_intent.latest_charge']
            });
        }

        const sessionResult = await sessions;

        // 3. Map to Admin Order Model
        const orders = sessionResult.data.map(session => {
            // Extract Metadata
            const tagCapacity = parseInt(session.metadata?.tagCapacity || '0');
            const selectedTags = session.metadata?.selectedTags || '{}';

            // Resolve Capacity Label
            const capacityLabel = CAPACITY_CONFIG[tagCapacity]?.label || `Capacity ${tagCapacity}`;

            // Handle Payment Intent & Charge
            let stripePaymentIntentId = '';
            let stripeChargeId = '';
            let refundStatus = 'none';

            if (typeof session.payment_intent === 'object' && session.payment_intent) {
                stripePaymentIntentId = session.payment_intent.id;

                // Check Charge
                // The type definition for latest_charge might be string or object depending on expansion
                const charge = session.payment_intent.latest_charge as Stripe.Charge | string | null;

                if (charge && typeof charge === 'object') {
                    stripeChargeId = charge.id;
                    if (charge.refunded) {
                        refundStatus = 'full';
                    } else if (charge.amount_refunded > 0) {
                        refundStatus = 'partial';
                    }
                } else if (typeof charge === 'string') {
                    stripeChargeId = charge;
                }
            } else if (typeof session.payment_intent === 'string') {
                stripePaymentIntentId = session.payment_intent;
            }

            return {
                orderId: session.id,
                createdAt: new Date(session.created * 1000).toISOString(),
                capacityLabel,
                tagCapacity,
                selectedTags,
                totalAmount: session.amount_total,
                currency: session.currency,
                stripePaymentIntentId,
                stripeChargeId,
                paymentStatus: session.payment_status,
                refundStatus
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify(orders)
        };

    } catch (error: any) {
        console.error('Admin API Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
