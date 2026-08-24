import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  newStatus: string;
}

const statusMessages: Record<string, { subject: string; heading: string; message: string }> = {
  pending: {
    subject: "Order Received",
    heading: "Thank You for Your Order!",
    message: "We've received your order and are preparing it for processing.",
  },
  processing: {
    subject: "Order Being Processed",
    heading: "Your Order is Being Prepared",
    message: "Great news! We're now processing your order and preparing your items.",
  },
  shipped: {
    subject: "Order Shipped!",
    heading: "Your Order is On Its Way!",
    message: "Exciting news! Your order has been shipped and is on its way to you.",
  },
  delivered: {
    subject: "Order Delivered",
    heading: "Your Order Has Been Delivered",
    message: "Your order has been delivered. We hope you enjoy your purchase!",
  },
  cancelled: {
    subject: "Order Cancelled",
    heading: "Your Order Has Been Cancelled",
    message: "Your order has been cancelled. If you have any questions, please contact us.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received order notification request");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus }: OrderNotificationRequest = await req.json();
    console.log(`Processing notification for order ${orderId} with status ${newStatus}`);

    if (!orderId || !newStatus) {
      throw new Error("Missing required fields: orderId and newStatus");
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      throw new Error("Order not found");
    }

    console.log("Order found:", order);

    // Fetch user profile separately
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching profile:", profileError);
      throw new Error("User email not found");
    }

    const statusInfo = statusMessages[newStatus] || {
      subject: "Order Status Update",
      heading: "Your Order Status Has Changed",
      message: `Your order status has been updated to: ${newStatus}`,
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0806; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0806; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(145deg, #141210, #0d0b09); border-radius: 4px; border: 1px solid rgba(191, 155, 48, 0.2);">
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <h1 style="color: #bf9b30; font-family: Georgia, serif; font-size: 28px; margin: 0 0 10px 0;">✨ Al Mishk</h1>
                      <p style="color: #8a7355; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Premium Attar & Fragrances</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px;">
                      <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, #bf9b30, transparent);">
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #f5f0e8; font-family: Georgia, serif; font-size: 24px; margin: 0 0 20px 0;">${statusInfo.heading}</h2>
                      <p style="color: #a89b8a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">${statusInfo.message}</p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(191, 155, 48, 0.05); border-radius: 4px; border: 1px solid rgba(191, 155, 48, 0.1); margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #8a7355; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Order Details</p>
                            <p style="color: #f5f0e8; font-size: 14px; margin: 0 0 8px 0;"><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
                            <p style="color: #f5f0e8; font-size: 14px; margin: 0 0 8px 0;"><strong>Status:</strong> <span style="color: #bf9b30;">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</span></p>
                            <p style="color: #f5f0e8; font-size: 14px; margin: 0;"><strong>Total:</strong> ₹${order.total_amount}</p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #a89b8a; font-size: 14px; line-height: 1.6; margin: 0;">Thank you for choosing Al Mishk. If you have any questions, please don't hesitate to contact us.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px;">
                      <hr style="border: none; height: 1px; background: linear-gradient(90deg, transparent, #bf9b30, transparent);">
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; text-align: center;">
                      <p style="color: #5a5249; font-size: 12px; margin: 0;">© 2024 Al Mishk. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    console.log(`Sending email to ${profile.email}`);

    const emailResponse = await resend.emails.send({
      from: "Al Mishk <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${statusInfo.subject} - Order #${orderId.slice(0, 8)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-order-notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
