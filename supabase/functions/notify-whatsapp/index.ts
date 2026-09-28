// ==============================================================================
// SUPABASE EDGE FUNCTION : notify-whatsapp
// ==============================================================================
// Reçoit un lead et envoie une alerte via l'API WhatsApp Cloud (Meta) ou Twilio

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lead, commercial, message } = await req.json();

    const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    const telDestinataire = (commercial?.whatsapp || "221762312003").replace(/\D/g, "");

    // Si les clés WhatsApp Cloud API sont configurées dans les secrets Supabase
    if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
      const urlMeta = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

      const reponseMeta = await fetch(urlMeta, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telDestinataire,
          type: "text",
          text: {
            preview_url: false,
            body: message || `🔔 Nouveau lead Lou Ame Tay : ${lead?.restaurant_nom} (${lead?.telephone}) - Score : ${lead?.score || 0}/100`,
          },
        }),
      });

      const resJson = await reponseMeta.json();
      return new Response(JSON.stringify({ success: true, meta: resJson }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Mode simulation / fallback si aucune clé renseignée
    console.log(`[WhatsApp Notify Simulation] Vers +${telDestinataire} :\n${message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        simulation: true, 
        message: "Message enregistré en console (Configurez WHATSAPP_API_TOKEN dans Supabase Secrets pour l'envoi réel)." 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
