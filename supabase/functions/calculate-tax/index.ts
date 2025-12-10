import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tax rates by state (simplified - in production use a tax API like TaxJar or Avalara)
const STATE_TAX_RATES: Record<string, number> = {
  "AL": 0.04, "AK": 0, "AZ": 0.056, "AR": 0.065, "CA": 0.0725,
  "CO": 0.029, "CT": 0.0635, "DE": 0, "FL": 0.06, "GA": 0.04,
  "HI": 0.04, "ID": 0.06, "IL": 0.0625, "IN": 0.07, "IA": 0.06,
  "KS": 0.065, "KY": 0.06, "LA": 0.0445, "ME": 0.055, "MD": 0.06,
  "MA": 0.0625, "MI": 0.06, "MN": 0.06875, "MS": 0.07, "MO": 0.04225,
  "MT": 0, "NE": 0.055, "NV": 0.0685, "NH": 0, "NJ": 0.06625,
  "NM": 0.05125, "NY": 0.04, "NC": 0.0475, "ND": 0.05, "OH": 0.0575,
  "OK": 0.045, "OR": 0, "PA": 0.06, "RI": 0.07, "SC": 0.06,
  "SD": 0.045, "TN": 0.07, "TX": 0.0625, "UT": 0.0485, "VT": 0.06,
  "VA": 0.043, "WA": 0.065, "WV": 0.06, "WI": 0.05, "WY": 0.04
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subtotal, state, zipCode } = await req.json();

    if (!subtotal || subtotal <= 0) {
      return new Response(
        JSON.stringify({ tax: 0, rate: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the tax rate for the state
    const stateCode = state?.toUpperCase();
    const rate = STATE_TAX_RATES[stateCode] || 0;
    
    // Calculate tax
    const tax = Math.round(subtotal * rate * 100) / 100;

    console.log(`Calculated tax for ${stateCode}: ${rate * 100}% = $${tax}`);

    return new Response(
      JSON.stringify({
        tax,
        rate: rate * 100, // Return as percentage
        state: stateCode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error calculating tax:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
