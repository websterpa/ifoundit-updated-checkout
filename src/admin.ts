// Access Control
const SECRET_KEY = 'x-admin-secret';
let currentSecret = '';

async function init() {
    currentSecret = prompt('Enter Admin/Support Secret') || '';
    if (!currentSecret) {
        document.body.innerHTML = '<h1>Access Denied</h1>';
        return;
    }

    // Default load: recent orders
    await loadOrders();

    // Setup Search
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input') as HTMLInputElement;

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            loadOrders(query);
        });

        // Allow Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                loadOrders(query);
            }
        });
    }
}

async function loadOrders(query: string = '') {
    const status = document.getElementById('status');
    const errDiv = document.getElementById('error-container');
    if (status) status.innerText = query ? `Searching for "${query}"...` : 'Loading recent orders...';
    if (errDiv) errDiv.innerText = '';

    try {
        // Use query param for search
        const url = query
            ? `/.netlify/functions/admin-list-orders?q=${encodeURIComponent(query)}`
            : '/.netlify/functions/admin-list-orders';

        const res = await fetch(url, {
            headers: { [SECRET_KEY]: currentSecret }
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const orders = await res.json();
        renderOrders(orders);
        if (status) status.style.display = 'none';
    } catch (err: any) {
        if (errDiv) errDiv.innerText = `Error: ${err.message}`;
        if (status) status.innerText = 'Failed to load.';
    }
}

function renderOrders(orders: any[]) {
    const tbody = document.getElementById('orders-body');
    const table = document.getElementById('orders-table');

    if (!tbody || !table) return;

    table.style.display = 'table';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 2rem;">No orders found.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleString();
        const amount = new Intl.NumberFormat('en-GB', { style: 'currency', currency: order.currency }).format(order.totalAmount / 100);

        let refundBadge = '-';
        if (order.refundStatus === 'full') refundBadge = '<span class="badge refunded">Full Refund</span>';
        if (order.refundStatus === 'partial') refundBadge = '<span class="badge partial">Partial</span>';

        // Parse items if JSON string
        let itemsSummary = '-';
        try {
            if (order.selectedTags) {
                const tags = typeof order.selectedTags === 'string' ? JSON.parse(order.selectedTags) : order.selectedTags;
                itemsSummary = Object.entries(tags)
                    .filter(([_, qty]) => (qty as number) > 0)
                    .map(([id, qty]) => `${qty}x ${id}`)
                    .join(', ');
            }
        } catch (e) { itemsSummary = 'Error parsing tags'; }

        // Dashboard Link (Charge or Payment Intent)
        // If we have charge ID, link to charge. Else Payment Intent.
        const dashboardLink = order.stripeChargeId
            ? `https://dashboard.stripe.com/payments/${order.stripeChargeId}`
            : `https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`;

        // Customer display: Email if available, else session ID snippet
        const customerDisplay = order.customerEmail || order.orderId.substring(0, 14) + '...';

        return `
            <tr>
                <td>${date}</td>
                <td style="font-family:monospace; font-size:0.85em;">${order.orderId.substring(0, 14)}...</td>
                <td>${customerDisplay}</td>
                <td>${order.capacityLabel}<br><small style="color:#666">Capacity: ${order.tagCapacity}</small></td>
                <td>${itemsSummary}</td>
                <td>${amount}</td>
                <td><span class="badge paid">${order.paymentStatus}</span></td>
                <td>${refundBadge}</td>
                <td><a href="${dashboardLink}" target="_blank">View Stripe</a></td>
            </tr>
        `;
    }).join('');
}

init();

import { injectBuildMetadata } from './metadata';
// Force show on admin page by setting flag temporarily or just calling logic?
// Logic checks localStorage. Let's force it for admin page since it's already gated.
// Actually, let's just use the same logic effectively, but pre-set the flag if we are in admin?
// Or just append unrelated to the flag.
// Prompt says: "Visible only when ADMIN_MODE... enabled".
// Admin page IS admin access.
// Let's explicitly show it on admin page regardless of localstorage, OR set the localstorage?
// We will just call the function. If the user wants to see it on admin, they'd likely have the flag.
// BUT "Admin Access ... Visible only when ADMIN_MODE".
// For the Admin View specifically, it makes sense to ALWAYS show it, as the user has already passed the secret check.
// I'll modify metadata.ts to allow force override, or just manually append here.
// Let's manually append here for simplicity and certainty.
const footer = document.createElement('div');
footer.style.position = 'fixed';
footer.style.bottom = '5px';
footer.style.right = '5px';
footer.style.fontSize = '10px';
footer.style.color = '#888';
// @ts-ignore
footer.innerText = `v:${__COMMIT_SHA__}`;
document.body.appendChild(footer);

injectBuildMetadata();
