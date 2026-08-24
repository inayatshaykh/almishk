import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Indian numbering format
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Number to words for Indian currency
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanHundred = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };

  const convertLessThanThousand = (n: number): string => {
    if (n < 100) return convertLessThanHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanHundred(n % 100) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';

  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
  }
  if (rupees >= 100000) {
    result += convertLessThanHundred(Math.floor((rupees % 10000000) / 100000)) + ' Lakh ';
  }
  if (rupees >= 1000) {
    result += convertLessThanHundred(Math.floor((rupees % 100000) / 1000)) + ' Thousand ';
  }
  if (rupees >= 100) {
    result += convertLessThanThousand(rupees % 1000);
  } else if (rupees > 0) {
    result += convertLessThanHundred(rupees);
  }

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertLessThanHundred(paise) + ' Paise';
  }

  return result + ' Only';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only generate invoice for delivered orders
    if (order.status !== 'delivered') {
      return new Response(
        JSON.stringify({ error: 'Invoice can only be generated for delivered orders' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ invoice: existingInvoice }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order items with products
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name, hsn_code, gst_percentage)')
      .eq('order_id', orderId);

    // Fetch customer profile
    const { data: customer } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.user_id)
      .single();

    // Fetch seller settings
    const { data: seller } = await supabase
      .from('seller_settings')
      .select('*')
      .limit(1)
      .single();

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number');

    // Calculate totals
    const isIntrastate = order.is_intrastate ?? true;
    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const itemDetails = (items || []).map((item: any) => {
      const gstPct = item.gst_percentage || item.products?.gst_percentage || 18;
      const taxable = item.taxable_amount || item.price_at_purchase * item.quantity;
      const totalGst = (taxable * gstPct) / 100;

      let cgst = 0, sgst = 0, igst = 0;
      if (isIntrastate) {
        cgst = totalGst / 2;
        sgst = totalGst / 2;
      } else {
        igst = totalGst;
      }

      subtotal += taxable;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      return {
        name: item.products?.name || 'Product',
        hsn: item.hsn_code || item.products?.hsn_code || '-',
        quantity: item.quantity,
        rate: item.price_at_purchase,
        taxable,
        gstPct,
        cgst,
        sgst,
        igst,
        total: taxable + cgst + sgst + igst,
      };
    });

    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const shipping = order.shipping_charges || 0;
    const discount = order.discount_amount || 0;
    const grandTotal = subtotal + totalTax + shipping - discount;

    // Generate HTML invoice (would typically use a PDF library)
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .company-name { font-size: 24px; font-weight: bold; color: #333; }
    .invoice-title { font-size: 18px; margin-top: 5px; }
    .section { margin: 20px 0; }
    .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
    .grid { display: flex; justify-content: space-between; }
    .grid-item { width: 48%; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #f9f9f9; }
    .grand-total { font-size: 16px; font-weight: bold; }
    .amount-words { font-style: italic; margin: 10px 0; padding: 10px; background: #f5f5f5; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${seller?.company_name || 'Mishk Elixir'}</div>
    <div>${seller?.address || ''}, ${seller?.city || ''}, ${seller?.state || ''} - ${seller?.pincode || ''}</div>
    <div>GSTIN: ${seller?.gstin || 'N/A'} | PAN: ${seller?.pan || 'N/A'}</div>
    <div>Phone: ${seller?.phone || 'N/A'} | Email: ${seller?.email || 'N/A'}</div>
    <div class="invoice-title">TAX INVOICE</div>
  </div>

  <div class="section">
    <div class="grid">
      <div class="grid-item">
        <div class="section-title">Bill To:</div>
        <div><strong>${customer?.full_name || 'Customer'}</strong></div>
        <div>${customer?.billing_address || order.shipping_address || ''}</div>
        <div>${customer?.billing_city || ''} ${customer?.billing_state || ''} ${customer?.billing_pincode || ''}</div>
        <div>Phone: ${customer?.mobile || 'N/A'}</div>
        <div>Email: ${customer?.email || 'N/A'}</div>
        ${customer?.gstin ? `<div>GSTIN: ${customer.gstin}</div>` : ''}
      </div>
      <div class="grid-item">
        <div class="section-title">Invoice Details:</div>
        <div>Invoice No: <strong>${invoiceNumber}</strong></div>
        <div>Invoice Date: ${new Date().toLocaleDateString('en-IN')}</div>
        <div>Order ID: ${order.id}</div>
        <div>Order Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}</div>
        <div>Place of Supply: ${customer?.shipping_state || customer?.billing_state || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>S.No</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Taxable Value</th>
          <th class="text-right">GST %</th>
          ${isIntrastate ? '<th class="text-right">CGST</th><th class="text-right">SGST</th>' : '<th class="text-right">IGST</th>'}
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemDetails.map((item: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.name}</td>
            <td>${item.hsn}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatINR(item.rate)}</td>
            <td class="text-right">${formatINR(item.taxable)}</td>
            <td class="text-right">${item.gstPct}%</td>
            ${isIntrastate ? 
              `<td class="text-right">${formatINR(item.cgst)}</td><td class="text-right">${formatINR(item.sgst)}</td>` : 
              `<td class="text-right">${formatINR(item.igst)}</td>`}
            <td class="text-right">${formatINR(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="${isIntrastate ? 5 : 5}">Subtotal</td>
          <td class="text-right">${formatINR(subtotal)}</td>
          <td></td>
          ${isIntrastate ? 
            `<td class="text-right">${formatINR(cgstTotal)}</td><td class="text-right">${formatINR(sgstTotal)}</td>` : 
            `<td class="text-right">${formatINR(igstTotal)}</td>`}
          <td class="text-right">${formatINR(subtotal + totalTax)}</td>
        </tr>
        ${shipping > 0 ? `
        <tr>
          <td colspan="${isIntrastate ? 9 : 8}" class="text-right">Shipping Charges</td>
          <td class="text-right">${formatINR(shipping)}</td>
        </tr>` : ''}
        ${discount > 0 ? `
        <tr>
          <td colspan="${isIntrastate ? 9 : 8}" class="text-right">Discount</td>
          <td class="text-right">-${formatINR(discount)}</td>
        </tr>` : ''}
        <tr class="grand-total">
          <td colspan="${isIntrastate ? 9 : 8}" class="text-right">Grand Total</td>
          <td class="text-right">${formatINR(grandTotal)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="amount-words">
    <strong>Amount in Words:</strong> ${numberToWords(grandTotal)}
  </div>

  <div class="section">
    <div class="grid">
      <div class="grid-item">
        <div class="section-title">Bank Details:</div>
        <div>Bank: ${seller?.bank_name || 'N/A'}</div>
        <div>A/C No: ${seller?.bank_account || 'N/A'}</div>
        <div>IFSC: ${seller?.bank_ifsc || 'N/A'}</div>
      </div>
      <div class="grid-item" style="text-align: right;">
        <div class="section-title">For ${seller?.company_name || 'Mishk Elixir'}</div>
        <div style="margin-top: 40px;">Authorized Signatory</div>
      </div>
    </div>
  </div>

  <div class="footer">
    This is a computer generated invoice and does not require a signature.
  </div>
</body>
</html>`;

    // For now, store the HTML as the invoice content
    // In production, you would use a PDF generation service
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString(),
        pdf_url: null, // Would be set after PDF generation
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invoice:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invoice created:', invoiceNumber);

    return new Response(
      JSON.stringify({ 
        invoice,
        html: invoiceHtml, // Return HTML for now, can be converted to PDF client-side
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
