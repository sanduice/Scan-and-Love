const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const hasSecret = !!Deno.env.get("STRIPE_SECRET_KEY");
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || null;

    // We avoid importing Stripe SDK here to prevent bundle-timeouts when CDN has issues.
    return new Response(
      JSON.stringify({
        configured: hasSecret,
        publishableKey,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("[get-stripe-config] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        configured: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
