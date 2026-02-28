export const config = { runtime: 'edge' };

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  let briefing;
  try {
    briefing = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Payload inválido.' }), { status: 400, headers: corsHeaders });
  }

  // ════════════════════════════════════════
  // ENVIA E-MAIL VIA EMAILJS
  // ════════════════════════════════════════
  try {
    const emailPayload = {
      service_id:  process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id:     process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        // Empresa
        empresa_nome:      briefing.empresa_nome,
        empresa_razao:     briefing.empresa_razao,
        empresa_cnpj:      briefing.empresa_cnpj,
        empresa_segmento:  briefing.empresa_segmento,
        empresa_tel:       briefing.empresa_tel,
        empresa_email:     briefing.empresa_email,
        empresa_ig:        briefing.empresa_ig || '—',
        empresa_fb:        briefing.empresa_fb || '—',
        endereco_completo: briefing.endereco_completo,
        // Responsável
        resp_nome:         briefing.resp_nome,
        resp_nascimento:   briefing.resp_nascimento,
        resp_cpf:          briefing.resp_cpf,
        resp_rg:           briefing.resp_rg,
        resp_tel:          briefing.resp_tel,
        resp_email:        briefing.resp_email,
        // Identidade
        cor_principal:     briefing.cor_principal,
        cor_secundaria:    briefing.cor_secundaria,
        estilo:            briefing.estilo,
        vibe:              briefing.vibe || '—',
        // Conteúdo
        objetivo:          briefing.objetivo,
        publico_alvo:      briefing.publico_alvo,
        descricao:         briefing.descricao,
        funcionalidades:   briefing.funcionalidades,
        referencias:       briefing.referencias || '—',
        obs:               briefing.obs || '—',
        data_envio:        briefing.data_envio,
        reply_to:          briefing.empresa_email,
        // Prompt pronto para copiar e colar em qualquer IA
        prompt_ia:         briefing.prompt_ia,
      },
    };

    const emailRes = await fetch(EMAILJS_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(emailPayload),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      throw new Error(`EmailJS error ${emailRes.status}: ${err}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Erro EmailJS:', err);
    return new Response(
      JSON.stringify({ error: `Falha ao enviar e-mail: ${err.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
}