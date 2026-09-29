/**
 * ==============================================================================
 * SUPABASE EDGE FUNCTION : generate-google-pass
 * GESTION DU LIEN GOOGLE WALLET PASS (ANDROID)
 * Lou Ame Tay — Cartes de visite digitales
 * ==============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { data: commercial, error } = await supabase
      .from("commerciaux")
      .select("*")
      .eq("id", commercialId)
      .single();

    if (error || !commercial) {
      return new Response(JSON.stringify({ error: "Commercial introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID") || "3388000000022345678";
    const webServiceURL = Deno.env.get("PUBLIC_SITE_URL") || "https://www.louametay.online";
    const carteUrl = `${webServiceURL}/carte.html?id=${encodeURIComponent(commercial.id)}`;

    // Structure Google Wallet Generic Pass Object
    const googleWalletObject = {
      id: `${issuerId}.lat_commercial_${commercial.id}`,
      classId: `${issuerId}.lat_carte_digitale_class`,
      logo: {
        sourceUri: {
          uri: `${webServiceURL}/images/logo.png`
        },
        contentDescription: {
          defaultValue: { language: "fr-FR", value: "Logo Lou Ame Tay" }
        }
      },
      cardTitle: {
        defaultValue: { language: "fr-FR", value: "Lou Ame Tay" }
      },
      subheader: {
        defaultValue: { language: "fr-FR", value: "Conseiller Restauration" }
      },
      header: {
        defaultValue: { language: "fr-FR", value: `${commercial.prenom} ${commercial.nom}` }
      },
      textModulesData: [
        {
          id: "poste",
          header: "POSTE",
          body: commercial.poste || "Conseiller Commercial"
        },
        {
          id: "telephone",
          header: "TÉLÉPHONE",
          body: commercial.telephone || "+221 77 130 36 78"
        },
        {
          id: "societe",
          header: "SOCIÉTÉ",
          body: "Lou Ame Tay Sénégal"
        }
      ],
      barcode: {
        type: "QR_CODE",
        value: carteUrl,
        alternateText: "Scanner pour ouvrir la carte"
      },
      hexBackgroundColor: "#0B1F3A"
    };

    // Mode simulation / information prêt à l'emploi
    return new Response(JSON.stringify({
      status: "google_wallet_ready",
      message: "Objet Google Wallet configuré. Pour générer l'URL Save to Google Wallet définitive, configurez GOOGLE_WALLET_ISSUER_ID et la clé de compte de service dans Supabase Secrets.",
      carteUrl: carteUrl,
      object: googleWalletObject,
      saveUrlPattern: `https://pay.google.com/gp/v/save/<SIGNED_JWT>`
    }, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
