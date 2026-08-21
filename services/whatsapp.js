function getConfig() {
    return {
        token: process.env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        graphVersion: process.env.WHATSAPP_GRAPH_VERSION || "v23.0",
        shopName: process.env.SHOP_NAME || "Vastraa"
    };
}

function normalizeWhatsApp(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("91") && digits.length >= 12) return digits;
    if (digits.length === 10) return "91" + digits;
    return digits;
}

async function sendWhatsAppText(to, body) {
    const cfg = getConfig();
    const recipient = normalizeWhatsApp(to);

    if (!cfg.token || !cfg.phoneNumberId || !recipient) {
        return { ok: false, skipped: true, reason: "WhatsApp Cloud API is not configured or the number is invalid." };
    }

    const url = `https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${cfg.token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipient,
            type: "text",
            text: { preview_url: false, body }
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error("WhatsApp API error:", data);
        return { ok: false, error: data };
    }

    return { ok: true, data };
}

function orderBillText(order, user) {
    const cfg = getConfig();
    const lines = [
        `*${cfg.shopName} — Order Bill*`,
        `Customer: ${user?.name || "Customer"}`,
        `Order ID: ${order._id}`,
        "",
        ...(order.items || []).map((item, i) => `${i + 1}. ${item.title} — ₹${Number(item.price || 0).toLocaleString("en-IN")}`),
        "",
        `*Total: ₹${Number(order.total || 0).toLocaleString("en-IN")}*`,
        `Payment: ${order.paymentMode === "test" ? "Test payment" : "Paid"}`,
        "",
        "Thank you for shopping with us."
    ];
    return lines.join("\n");
}

module.exports = { sendWhatsAppText, orderBillText, normalizeWhatsApp };
