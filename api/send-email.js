export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const payload = req.body || {}

  const {
    customerName,
    customerMobile,
    customerEmail,
    customerAddress,
    systemType,
    brand,
    cameraType,
    cameraCount,
    items,
    discount,
    discountRate,
    grandTotal,
    terms,
    pdfBase64,
  } = payload

  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ message: "BREVO_API_KEY is not configured on the server" })
  }

  try {
    // Build a simple HTML table for items
    const itemsHtml = (items || [])
      .map(
        (it) => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd">${it.name}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${it.qty}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right">₹${(it.price || 0).toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right">₹${(it.amount || 0).toFixed(2)}</td>
        </tr>
      `,
      )
      .join("")

    const htmlContent = `
      <h2>New Quotation</h2>
      <p><strong>Customer:</strong> ${customerName || "N/A"}</p>
      <p><strong>Mobile:</strong> ${customerMobile || "N/A"}</p>
      <p><strong>Email:</strong> ${customerEmail || "N/A"}</p>
      <p><strong>Address:</strong> ${customerAddress || "N/A"}</p>
      <p><strong>System Type:</strong> ${systemType || "N/A"}</p>
      <p><strong>Brand:</strong> ${brand || "N/A"}</p>
      <h3>Items</h3>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Item</th>
            <th style="padding:6px;border:1px solid #ddd">Qty</th>
            <th style="padding:6px;border:1px solid #ddd">Price</th>
            <th style="padding:6px;border:1px solid #ddd">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td colspan="3" style="padding:6px;border:1px solid #ddd;text-align:right"><strong>Discount</strong></td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">₹${(discount || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:6px;border:1px solid #ddd;text-align:right"><strong>Grand Total</strong></td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">₹${(grandTotal || 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <h3>Terms</h3>
      <ul>
        ${(terms || []).map((t) => `<li>${t}</li>`).join("")}
      </ul>
    `

    // Prepare Brevo payload
    const brevoPayload = {
      sender: { email: "no-reply@eyetechsecurities.in", name: "AK Infotech" },
      to: [
        { email: "sales@eyetechsecurities.in", name: "Sales" },
        // include customer email as CC recipient if provided
      ],
      subject: `AK Infotech New Quotation - ${customerName || "Customer"}`,
      htmlContent,
    }

    if (customerEmail) {
      // Add customer to CC (or "to" if you prefer to send separate mail)
      brevoPayload.cc = [{ email: customerEmail, name: customerName || "Customer" }]
    }

    // Attach PDF if provided
    if (pdfBase64) {
      brevoPayload.attachment = [
        {
          content: pdfBase64,
          name: `quotation_${(customerName || "customer").replace(/\s+/g, "_")}.pdf`,
        },
      ]
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Brevo API error: ${response.status} ${text}`)
    }

    res.status(200).json({ message: "Quotation emailed successfully" })
  } catch (error) {
    console.error("send-email error:", error)
    res.status(500).json({ message: error.message || "Failed to send email" })
  }
}
