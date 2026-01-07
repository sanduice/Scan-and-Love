const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toStripeFormBody(params: Record<string, string | number | boolean | null | undefined>): string {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    body.set(k, String(v));
  }
  return body.toString();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const { amount, currency = "usd", metadata = {} } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(Number(amount) * 100);

    console.log(`[create-payment-intent] Creating payment intent for ${amountInCents} cents`);

    // Create PaymentIntent via Stripe REST API (avoids Stripe SDK dependency)
    const form = new URLSearchParams();
    form.set("amount", String(amountInCents));
    form.set("currency", String(currency));
    form.set("automatic_payment_methods[enabled]", "true");

    if (metadata && typeof metadata === "object") {
      for (const [key, value] of Object.entries(metadata)) {
        if (value === undefined || value === null) continue;
        form.set(`metadata[${key}]`, String(value));
      }
    }

    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const payload = await res.json();
    if (!res.ok) {
      const msg = payload?.error?.message || `Stripe error (${res.status})`;
      throw new Error(msg);
    }

    console.log(`[create-payment-intent] Payment intent created: ${payload.id}`);

    return new Response(
      JSON.stringify({
        clientSecret: payload.client_secret,
        paymentIntentId: payload.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("[create-payment-intent] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
