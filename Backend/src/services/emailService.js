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
    amount
) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:40px 15px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">

<!-- Header -->

<tr>
<td style="background:#111111;padding:35px 20px;text-align:center;">

<div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#ffffff;">
    VELOCITY
</div>

<div style="margin-top:10px;font-size:11px;letter-spacing:4px;color:#d1d5db;">
    PERFORMANCE MEETS LIFESTYLE
</div>

</td>
</tr>

<!-- Content -->

<tr>
<td style="padding:45px 40px 35px;text-align:center;">

<div style="
    width:70px;
    height:70px;
    margin:0 auto 25px;
    background:#dcfce7;
    border-radius:50%;
    line-height:70px;
    font-size:38px;
    color:#16a34a;
    font-weight:bold;
">
    ✓
</div>

<h1 style="margin:0;color:#111827;font-size:30px;">
    Payment Successful
</h1>

<p style="margin:12px 0 35px;color:#6b7280;font-size:17px;">
    Your order has been confirmed.
</p>

<!-- Order Details -->

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:10px;text-align:left;">

<tr>
<td style="padding:25px;border-bottom:1px solid #e5e7eb;">

<div style="font-size:12px;letter-spacing:2px;color:#64748b;font-weight:bold;">
    ORDER ID
</div>

<div style="margin-top:8px;font-size:15px;color:#111827;font-weight:bold;word-break:break-all;">
    ${orderId}
</div>

</td>
</tr>

<tr>
<td style="padding:25px;border-bottom:1px solid #e5e7eb;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>

<td>

<div style="font-size:12px;letter-spacing:2px;color:#64748b;font-weight:bold;">
    AMOUNT PAID
</div>

<div style="margin-top:8px;font-size:24px;color:#111827;font-weight:bold;">
    ₹${Number(amount).toFixed(2)}
</div>

</td>

<td align="right" valign="middle">

<span style="
    display:inline-block;
    background:#dcfce7;
    color:#15803d;
    padding:9px 15px;
    border-radius:20px;
    font-size:12px;
    font-weight:bold;
">
    ✓ PAID
</span>

</td>

</tr>
</table>

</td>
</tr>

<tr>
<td style="padding:25px;">

<div style="font-size:12px;letter-spacing:2px;color:#64748b;font-weight:bold;">
    PAYMENT STATUS
</div>

<div style="margin-top:8px;font-size:16px;color:#111827;font-weight:bold;">
    Successful
</div>

</td>
</tr>

</table>

<!-- Message -->

<p style="margin:35px 0 10px;font-size:17px;line-height:1.6;color:#111827;">
    Thank you for shopping with VELOCITY.
</p>

<p style="margin:0;color:#111827;font-size:15px;line-height:1.7;">
    Your payment has been successfully processed and your order is now confirmed.
</p>

<p style="margin:15px 0 30px;color:#64748b;font-size:14px;">
    We'll keep you updated about your order.
</p>

<!-- Button -->

<a href="${process.env.FRONTEND_URL || "http://localhost:3000"}"
style="
    display:inline-block;
    background:#111111;
    color:#ffffff;
    text-decoration:none;
    padding:17px 45px;
    border-radius:8px;
    font-size:13px;
    font-weight:bold;
    letter-spacing:2px;
">
    VIEW YOUR ORDER →
</a>

</td>
</tr>

<!-- Features -->

<tr>
<td style="background:#f8fafc;padding:28px 20px;border-top:1px solid #e5e7eb;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>

<td width="33%" align="center" style="color:#64748b;font-size:13px;">
    🚚<br>
    <span style="display:inline-block;margin-top:8px;">
        Fast & Reliable<br>
        Delivery
    </span>
</td>

<td width="33%" align="center" style="color:#64748b;font-size:13px;border-left:1px solid #d1d5db;border-right:1px solid #d1d5db;">
    🛡<br>
    <span style="display:inline-block;margin-top:8px;">
        Secure<br>
        Payments
    </span>
</td>

<td width="33%" align="center" style="color:#64748b;font-size:13px;">
    🎧<br>
    <span style="display:inline-block;margin-top:8px;">
        Dedicated<br>
        Support
    </span>
</td>

</tr>
</table>

</td>
</tr>

<!-- Footer -->

<tr>
<td style="background:#f8fafc;padding:25px;text-align:center;border-top:1px solid #e5e7eb;">

<p style="margin:0;color:#94a3b8;font-size:12px;">
    This is an automated email from VELOCITY.
</p>

<p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">
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