const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (
    to,
    subject,
    message,
    orderId,
    amount,
    eventType
) => {
    let title;
    let description;
    let status;
    let statusBadge;
    let icon;
    let iconBackground;
    let iconColor;
    let badgeBackground;
    let badgeColor;
    let footerMessage;
    let amountLabel;

    if (eventType === "PaymentProcessed") {
        title = "Payment Successful";
        description = "Your order has been confirmed.";
        status = "Successful";
        statusBadge = "✓ PAID";
        icon = "✓";
        iconBackground = "#dcfce7";
        iconColor = "#16a34a";
        badgeBackground = "#dcfce7";
        badgeColor = "#15803d";
        amountLabel = "AMOUNT PAID";
        footerMessage =
            "Your payment has been successfully processed and your order is now confirmed.";
    } else if (eventType === "PaymentFailed") {
        title = "Payment Failed";
        description = "We were unable to process your payment.";
        status = "Failed";
        statusBadge = "✕ FAILED";
        icon = "✕";
        iconBackground = "#fee2e2";
        iconColor = "#dc2626";
        badgeBackground = "#fee2e2";
        badgeColor = "#b91c1c";
        amountLabel = "AMOUNT";
        footerMessage =
            "Your payment could not be processed. Please try again with another payment method.";
    } else if (eventType === "OrderCancelled") {
        title = "Order Cancelled";
        description = "Your order has been cancelled.";
        status = "Cancelled";
        statusBadge = "✕ CANCELLED";
        icon = "✕";
        iconBackground = "#fee2e2";
        iconColor = "#dc2626";
        badgeBackground = "#fee2e2";
        badgeColor = "#b91c1c";
        amountLabel = "ORDER AMOUNT";
        footerMessage =
            "Your order has been cancelled because the payment was not completed successfully.";
    } else {
        throw new Error(
            `Unsupported notification event: ${eventType}`
        );
    }

    const formattedAmount =
        amount !== undefined &&
        amount !== null &&
        !Number.isNaN(Number(amount))
            ? `₹${Number(amount).toFixed(2)}`
            : "—";

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>

<body style="margin:0;padding:0;background:#f1f3f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f3f5;padding:40px 15px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">

<tr>
<td style="background:#111111;padding:38px 25px;text-align:center;">

<div style="font-size:31px;font-weight:bold;letter-spacing:8px;color:#ffffff;">
    VELOCITY
</div>

<div style="margin-top:10px;font-size:10px;letter-spacing:4px;color:#cbd5e1;">
    PERFORMANCE MEETS LIFESTYLE
</div>

</td>
</tr>

<tr>
<td style="padding:48px 42px 42px;text-align:center;">

<div style="width:72px;height:72px;margin:0 auto 24px;background:${iconBackground};border-radius:50%;line-height:72px;font-size:36px;color:${iconColor};font-weight:bold;">
    ${icon}
</div>

<h1 style="margin:0;font-size:29px;line-height:1.3;color:#111827;">
    ${title}
</h1>

<p style="margin:12px 0 36px;color:#64748b;font-size:16px;line-height:1.6;">
    ${description}
</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;text-align:left;">

<tr>
<td style="padding:22px 24px;border-bottom:1px solid #e5e7eb;">

<div style="font-size:10px;letter-spacing:2px;color:#64748b;font-weight:bold;">
    ORDER ID
</div>

<div style="margin-top:8px;font-size:14px;line-height:1.5;color:#111827;font-weight:bold;word-break:break-all;">
    ${orderId}
</div>

</td>
</tr>

<tr>
<td style="padding:22px 24px;border-bottom:1px solid #e5e7eb;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>

<td>

<div style="font-size:10px;letter-spacing:2px;color:#64748b;font-weight:bold;">
    ${amountLabel}
</div>

<div style="margin-top:8px;font-size:24px;color:#111827;font-weight:bold;">
    ${formattedAmount}
</div>

</td>

<td align="right" valign="middle">

<span style="display:inline-block;background:${badgeBackground};color:${badgeColor};padding:8px 13px;border-radius:20px;font-size:10px;font-weight:bold;letter-spacing:0.5px;">
    ${statusBadge}
</span>

</td>

</tr>
</table>

</td>
</tr>

<tr>
<td style="padding:22px 24px;">

<div style="font-size:10px;letter-spacing:2px;color:#64748b;font-weight:bold;">
    PAYMENT STATUS
</div>

<div style="margin-top:8px;font-size:16px;color:#111827;font-weight:bold;">
    ${status}
</div>

</td>
</tr>

</table>

<p style="margin:34px 0 10px;font-size:16px;line-height:1.6;color:#111827;font-weight:bold;">
    Thank you for shopping with VELOCITY.
</p>

<p style="margin:0;color:#475569;font-size:14px;line-height:1.8;">
    ${footerMessage}
</p>

<p style="margin:14px 0 28px;color:#94a3b8;font-size:13px;line-height:1.6;">
    We'll keep you updated about your order.
</p>

<a href="https://velocity-ecom.vercel.app/order-tracking.html" id="view-order-btn"
style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:15px 38px;border-radius:7px;font-size:12px;font-weight:bold;letter-spacing:1.5px;">
    VIEW YOUR ORDER →
</a>

</td>
</tr>

<tr>
<td style="background:#f8fafc;padding:26px 18px;border-top:1px solid #e5e7eb;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>

<td width="33%" align="center" style="color:#64748b;font-size:12px;line-height:1.5;">
    <div style="font-size:20px;">🚚</div>
    <div style="margin-top:6px;">
        Fast & Reliable<br>
        Delivery
    </div>
</td>

<td width="33%" align="center" style="color:#64748b;font-size:12px;line-height:1.5;border-left:1px solid #d1d5db;border-right:1px solid #d1d5db;">
    <div style="font-size:20px;">🛡</div>
    <div style="margin-top:6px;">
        Secure<br>
        Payments
    </div>
</td>

<td width="33%" align="center" style="color:#64748b;font-size:12px;line-height:1.5;">
    <div style="font-size:20px;">🎧</div>
    <div style="margin-top:6px;">
        Dedicated<br>
        Support
    </div>
</td>

</tr>
</table>

</td>
</tr>

<tr>
<td style="background:#f8fafc;padding:22px 25px;text-align:center;border-top:1px solid #e5e7eb;">

<p style="margin:0;color:#94a3b8;font-size:11px;">
    This is an automated email from VELOCITY.
</p>

<p style="margin:7px 0 0;color:#94a3b8;font-size:11px;">
    Please do not reply to this email.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    await transporter.sendMail({
        from: `"VELOCITY" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: message,
        html
    });

    console.log("Email sent to:", to);
};

module.exports = {
    sendEmail
};