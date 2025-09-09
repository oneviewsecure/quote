
// ... all your existing code before remains unchanged ...

// ================= NEW PDF GENERATION =================
function generatePDFWithJSPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // COLORS
      const primaryColor = [0, 102, 204];
      const lightGray = [245, 245, 245];

      // HEADER band
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 30, "F");

      // Add Logo (40x40 px, left side)
      const img = new Image();
      img.src = "logo.jpeg";
      img.onload = function() {
        doc.addImage(img, "JPEG", 10, 5, 20, 20);

        // Company name & tagline (right side)
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("One View Secure Technologies", 200, 15, { align: "right" });
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Your Vision, Our Protection", 200, 22, { align: "right" });

        // Quotation Info Block
        const currentDate = new Date().toLocaleDateString("en-IN");
        const quotationNumber = `QT${Date.now().toString().slice(-6)}`;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`Quotation #: ${quotationNumber}`, 150, 35);
        doc.text(`Date: ${currentDate}`, 150, 42);

        // Customer Details Box
        let y = 50;
        doc.setFillColor(...lightGray);
        doc.roundedRect(14, y, 182, 35, 3, 3, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Customer Details", 18, y + 7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Name: ${data.customerName || ""}`, 18, y + 14);
        doc.text(`Mobile: ${data.customerMobile || ""}`, 18, y + 20);
        doc.text(`Email: ${data.customerEmail || "N/A"}`, 18, y + 26);
        doc.text(`Address: ${data.customerAddress || "N/A"}`, 18, y + 32);

        // Items Table Header
        y += 50;
        doc.setFillColor(...primaryColor);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.rect(14, y - 5, 182, 8, "F");
        doc.text("Item", 18, y);
        doc.text("Qty", 110, y);
        doc.text("Price", 140, y);
        doc.text("Amount", 170, y);

        // Table Rows
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        y += 10;
        data.items.forEach((item, i) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          if (i % 2 === 0) {
            doc.setFillColor(...lightGray);
            doc.rect(14, y - 5, 182, 8, "F");
          }
          doc.text(item.name, 18, y);
          doc.text(String(item.qty), 112, y, { align: "right" });
          doc.text(`₹${(item.price || 0).toFixed(2)}`, 150, y, { align: "right" });
          doc.text(`₹${(item.amount || 0).toFixed(2)}`, 190, y, { align: "right" });
          y += 8;
        });

        // Summary Box
        y += 10;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(120, y, 76, 28, 3, 3, "S");
        doc.setFont("helvetica", "normal");
        doc.text("Subtotal:", 124, y + 7);
        doc.text("Discount:", 124, y + 14);
        doc.setFont("helvetica", "bold");
        doc.text("Grand Total:", 124, y + 22);

        const subtotal = data.items.reduce((s, it) => s + (it.amount || 0), 0);
        doc.setFont("helvetica", "normal");
        doc.text(`₹${subtotal.toFixed(2)}`, 190, y + 7, { align: "right" });
        doc.text(`₹${(data.discount || 0).toFixed(2)}`, 190, y + 14, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.text(`₹${(data.grandTotal || subtotal).toFixed(2)}`, 190, y + 22, { align: "right" });

        // Terms & Conditions
        y += 40;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Terms & Conditions:", 14, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const terms = data.terms || [];
        let ty = y + 6;
        terms.forEach((t) => {
          doc.text(`- ${t}`, 18, ty, { maxWidth: 178 });
          ty += 5;
          if (ty > 270) {
            doc.addPage();
            ty = 20;
          }
        });

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Thank you for choosing One View Secure Technologies", 105, 290, { align: "center" });
        doc.text("Website: www.oneviewsecure.in", 105, 296, { align: "center" });

        const pdfData = doc.output("datauristring");
        resolve(pdfData);
      };
    } catch (err) {
      reject(err);
    }
  });
}

// ... rest of your existing code unchanged ...
