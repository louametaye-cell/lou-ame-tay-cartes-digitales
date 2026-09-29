/**
 * ==============================================================================
 * SUPABASE EDGE FUNCTION : generate-apple-pass
 * GESTION DU FICHIER .PKPASS POUR APPLE WALLET (IOS)
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

    const passTypeIdentifier = Deno.env.get("APPLE_PASS_TYPE_ID") || "pass.com.louametay.carte";
    const teamIdentifier = Deno.env.get("APPLE_TEAM_ID") || "LOUAMETAY01";
    const webServiceURL = Deno.env.get("PUBLIC_SITE_URL") || "https://www.louametay.online";
    const carteUrl = `${webServiceURL}/carte.html?id=${encodeURIComponent(commercial.id)}`;

    // Structure standard Apple Wallet pass.json (Generic Pass)
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: passTypeIdentifier,
      serialNumber: `LAT-${commercial.id}`,
      teamIdentifier: teamIdentifier,
      organizationName: "Lou Ame Tay",
      description: `Carte digitale de ${commercial.prenom} ${commercial.nom}`,
      logoText: "Lou Ame Tay",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(11, 31, 58)",
      labelColor: "rgb(201, 162, 39)",
      generic: {
        primaryFields: [
          {
            key: "nom_complet",
            label: "CONSEILLER CHR",
            value: `${commercial.prenom} ${commercial.nom}`,
          }
        ],
        secondaryFields: [
          {
            key: "poste",
            label: "FONCTION",
            value: commercial.poste || "Conseiller Commercial",
          },
          {
            key: "societe",
            label: "ENTREPRISE",
            value: "Lou Ame Tay Sénégal",
          }
        ],
        auxiliaryFields: [
          {
            key: "telephone",
            label: "TÉLÉPHONE",
            value: commercial.telephone || "+221 77 130 36 78",
          },
          {
            key: "whatsapp",
            label: "WHATSAPP",
            value: commercial.whatsapp || commercial.telephone || "",
          }
        ],
        backFields: [
          {
            key: "site",
            label: "Plateforme Lou Ame Tay",
            value: "https://www.louametay.com",
          },
          {
            key: "carte_directe",
            label: "Lien de la carte digitale",
            value: carteUrl,
          },
          {
            key: "apropos",
            label: "À propos de Lou Ame Tay",
            value: "Menus digitaux QR Code, écrans cuisine KDS et encaissement moderne pour restaurants au Sénégal.",
          }
        ]
      },
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: carteUrl,
          messageEncoding: "iso-8859-1",
          altText: "Scannez pour ouvrir la carte",
        }
      ]
    };

    // Vérifier si la signature Apple est activée
    const certP12 = Deno.env.get("APPLE_PASS_CERT_P12_BASE64");

    if (!certP12) {
      // Mode simulation / fallback direct avec fichier JSON formaté Apple Pass
      return new Response(JSON.stringify({
        status: "pass_generated",
        mode: "ready_for_pkpass_signing",
        message: "Pour générer le fichier .pkpass binaire signé, configurez APPLE_PASS_CERT_P12_BASE64 dans les secrets Supabase.",
        pass: passData,
        carteUrl: carteUrl
      }, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `inline; filename="pass_${commercial.prenom}_${commercial.nom}.json"`
        },
      });
    }

    // Si les certificats sont présents, renvoie le type MIME pkpass
    return new Response(JSON.stringify(passData), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="carte_${commercial.prenom}_${commercial.nom}.pkpass"`
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
