import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const asaasApiKey = Deno.env.get("ASAAS_API_KEY") || "";
const asaasWebhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apenas aceita requisições POST do Asaas
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // 1. Validação opcional de token secreto do webhook
    if (asaasWebhookSecret) {
      const receivedToken = req.headers.get("asaas-access-token");
      if (receivedToken !== asaasWebhookSecret) {
        console.warn("Webhook Asaas: Token de autenticação inválido.");
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    const payload = await req.json();
    const event = payload.event;
    const payment = payload.payment;

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, payment ? `Payment ID: ${payment.id}` : "");

    if (!payment) {
      // Evento sem payment (ex: teste de ping do Asaas)
      return new Response(JSON.stringify({ success: true, message: "Ping recebido com sucesso" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const customerId = payment.customer;

    // 2. Eventos de Pagamento Aprovado / Recebido (Pix, Cartão ou Boleto compensado)
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      let customerEmail = "";
      let customerName = "";

      // Busca dados cadastrais do cliente na API do Asaas usando o customerId
      if (customerId && asaasApiKey) {
        try {
          const customerRes = await fetch(`https://api.asaas.com/v3/customers/${customerId}`, {
            headers: {
              "access_token": asaasApiKey,
              "Accept": "application/json"
            }
          });

          if (customerRes.ok) {
            const customerData = await customerRes.json();
            customerEmail = (customerData.email || "").toLowerCase().trim();
            customerName = customerData.name || "";
          } else {
            console.error("Erro ao buscar cliente no Asaas:", await customerRes.text());
          }
        } catch (fetchErr) {
          console.error("Falha na chamada da API Asaas Customers:", fetchErr);
        }
      }

      if (!customerEmail) {
        console.warn(`[Asaas Webhook] Cliente ${customerId} não possui e-mail cadastrado.`);
        return new Response(JSON.stringify({ success: false, error: "E-mail não localizado" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Calcula data de expiração inteligente:
      // Se valor >= R$ 100 ou descrição contiver "anual", concede 375 dias (1 ano + 10 dias de carência).
      // Caso contrário, considera plano mensal e concede 35 dias (30 dias + 5 dias de carência).
      const paymentValue = Number(payment.value) || 0;
      const paymentDesc = (payment.description || "").toLowerCase();
      const paymentCycle = (payment.cycle || "").toUpperCase();
      
      const isAnnual = paymentValue >= 100 || 
                       paymentDesc.includes("anual") || 
                       paymentDesc.includes("ano") || 
                       paymentDesc.includes("yearly") || 
                       paymentCycle === "YEARLY" || 
                       paymentCycle === "ANNUALLY";

      const graceDays = isAnnual ? 375 : 35;

      // Verifica se o usuário já possui validade futura para não perder dias restantes
      const { data: existingSub } = await supabaseAdmin
        .from('pro_subscriptions')
        .select('expires_at')
        .eq('email', customerEmail)
        .maybeSingle();

      const now = new Date();
      let baseDate = new Date(payment.clientPaymentDate || payment.paymentDate || now);
      if (existingSub?.expires_at) {
        const existingExpires = new Date(existingSub.expires_at);
        if (existingExpires > baseDate) {
          baseDate = existingExpires;
        }
      }

      const expiresAt = new Date(baseDate);
      expiresAt.setDate(expiresAt.getDate() + graceDays);

      // Upsert no banco de dados Supabase
      const { error: upsertError } = await supabaseAdmin
        .from('pro_subscriptions')
        .upsert({
          email: customerEmail,
          customer_name: customerName,
          asaas_customer_id: customerId,
          asaas_payment_id: payment.id,
          asaas_subscription_id: payment.subscription || null,
          status: 'active',
          billing_type: payment.billingType,
          value: payment.value,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (upsertError) {
        console.error("Erro ao salvar assinatura PRO no banco:", upsertError);
        return new Response(JSON.stringify({ success: false, error: upsertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`[Asaas Webhook] Assinatura PRO ATIVADA para ${customerEmail} até ${expiresAt.toISOString()}`);

      return new Response(JSON.stringify({ success: true, activated: customerEmail }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Eventos de Cancelamento / Estorno
    if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED" || event === "SUBSCRIPTION_INACTIVATED" || event === "SUBSCRIPTION_DELETED") {
      if (customerId) {
        await supabaseAdmin
          .from('pro_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('asaas_customer_id', customerId);

        console.log(`[Asaas Webhook] Assinatura cancelada para customerId: ${customerId}`);
      }
    }

    // 4. Evento de Vencido / Atrasado
    if (event === "PAYMENT_OVERDUE") {
      if (customerId) {
        await supabaseAdmin
          .from('pro_subscriptions')
          .update({
            status: 'overdue',
            updated_at: new Date().toISOString()
          })
          .eq('asaas_customer_id', customerId);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: event }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[Asaas Webhook] Erro inesperado:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200, // Retornamos 200 para evitar que o Asaas desative o webhook por retry infinito
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
