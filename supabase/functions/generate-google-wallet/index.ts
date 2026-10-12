/**
 * ==============================================================================
 * SUPABASE EDGE FUNCTION : generate-google-wallet
 * GESTION DU PASS GOOGLE WALLET OU FALLBACK VCARD SI SANS CERTIFICAT
 * Lou Ame Tay — Cartes de visite digitales
 * ==============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function genererVCardFallback(commercial: any): string {
  const prenom = commercial.prenom || "Conseiller";
  const nom = commercial.nom || "Lou Ame Tay";
  const tel = (commercial.telephone || "+221 77 458 74 74").replace(/\s+/g, "");
  const whatsapp = (commercial.whatsapp || commercial.telephone || "221774587474").replace(/\D/g, "");
  const email = commercial.email || "contact@louametay.online";
  const role = commercial.poste || commercial.role || "Conseiller Commercial CHR";
  const siteUrl = "https://www.louametay.com";

  return [
    "BEGIN:VCARD",
    "VERSION:4.0",
    `N:${nom};${prenom};;;`,
    `FN:${prenom} ${nom}`,
    `ORG:Lou Ame Tay SASU`,
    `TITLE:${role}`,
    `TEL;TYPE=cell,voice;VALUE=uri:tel:${tel}`,
    `EMAIL;TYPE=work:${email}`,
    `URL:${siteUrl}`,
    `NOTE:Conseiller officiel Lou Ame Tay (Solutions Menu QR & Écran Cuisine KDS). WhatsApp: https://wa.me/${whatsapp}`,
    "END:VCARD"
  ].join("\r\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const commercialId = url.searchParams.get("id");

    if (!commercialId) {
      return new Response(JSON.stringify({ error: "Identifiant commercial requis (?id=)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: commercial } = await supabase
      .from("commerciaux")
      .select("*")
      .eq("id", commercialId)
      .single();

    const c = commercial || {
      prenom: "Conseiller",
      nom: "Lou Ame Tay",
      telephone: "+221 77 130 36 78",
      email: "contact@louametay.com"
    };

    const googleKey = Deno.env.get("GOOGLE_WALLET_PRIVATE_KEY");

    // Si les clés Google Wallet sont absentes → Fallback vCard natif
    if (!googleKey) {
      const vcard = genererVCardFallback(c);
      return new Response(vcard, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/vcard; charset=utf-8",
          "Content-Disposition": `attachment; filename="contact_${c.prenom}_${c.nom}.vcf"`
        }
      });
    }

    // Si les clés sont présentes (flux JWT Save to Wallet)
    return new Response(JSON.stringify({ status: "google_wallet_ready" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
