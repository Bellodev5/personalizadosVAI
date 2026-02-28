export const config = { runtime: 'edge' };

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const EMAILJS_API   = 'https://api.emailjs.com/api/v1.0/email/send';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // ── CORS (ajuste a origem para seu domínio em produção) ──
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
  // 1. MONTA O PROMPT PARA O CLAUDE
  // ════════════════════════════════════════
  const prompt = `Você é um desenvolvedor web sênior especialista em criar sites profissionais e modernos.

Com base no briefing abaixo, crie a versão 1.0 completa de um site em HTML/CSS/JS puro (arquivo único, tudo inline).

## BRIEFING DO CLIENTE

- **Empresa:** ${briefing.empresa_nome} (${briefing.empresa_razao})
- **CNPJ:** ${briefing.empresa_cnpj}
- **Contato:** ${briefing.empresa_tel} | ${briefing.empresa_email}
- **Localização:** ${briefing.empresa_local}
- **Instagram:** ${briefing.empresa_ig || '—'}
- **Facebook:** ${briefing.empresa_fb || '—'}

### Identidade Visual
- **Cor Principal:** ${briefing.cor_principal}
- **Cor Secundária:** ${briefing.cor_secundaria}
- **Estilo:** ${briefing.estilo}
- **Vibe da marca:** ${briefing.vibe || '—'}

### Conteúdo
- **Objetivo:** ${briefing.objetivo}
- **Descrição do negócio:** ${briefing.descricao}
- **Funcionalidades:** ${briefing.funcionalidades}
- **Sites de referência:** ${briefing.referencias || '—'}

### Observações
${briefing.obs || 'Nenhuma'}

---

## INSTRUÇÕES DE GERAÇÃO

1. Crie um site completo, responsivo e visualmente impressionante
2. Use as cores exatas informadas como variáveis CSS (--primary, --secondary)
3. Inclua as seguintes seções conforme o objetivo: Hero, Sobre, Serviços/Produtos, Contato
4. Adicione as funcionalidades solicitadas de forma funcional
5. Use Google Fonts (escolha tipografia adequada ao estilo)
6. Inclua botão de WhatsApp flutuante com o número ${briefing.empresa_tel}
7. O site deve ter animações suaves de entrada (CSS)
8. Textos devem ser profissionais e coerentes com o segmento
9. Rodapé com dados da empresa
10. Meta tags SEO básicas

Retorne APENAS o código HTML completo, sem explicações, sem blocos de markdown, sem comentários fora do código.`;

  // ════════════════════════════════════════
  // 2. CHAMA A API DO CLAUDE
  // ════════════════════════════════════════
  let siteCode = '';
  try {
    const claudeRes = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-6',
        max_tokens: 8000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Claude API error ${claudeRes.status}: ${err}`);
    }

    const claudeData = await claudeRes.json();
    siteCode = claudeData.content?.[0]?.text || '';

    if (!siteCode) throw new Error('Claude não retornou código.');

  } catch (err) {
    console.error('Erro Claude:', err);
    return new Response(
      JSON.stringify({ error: `Falha ao gerar o site: ${err.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }

  // ════════════════════════════════════════
  // 3. ENVIA E-MAIL VIA EMAILJS (server-side)
  // ════════════════════════════════════════
  try {
    const emailPayload = {
      service_id:  process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id:     process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY, // Private Key para uso server-side
      template_params: {
        // Empresa
        empresa_nome:       briefing.empresa_nome,
        empresa_razao:      briefing.empresa_razao,
        empresa_cnpj:       briefing.empresa_cnpj,
        empresa_tel:        briefing.empresa_tel,
        empresa_email:      briefing.empresa_email,
        empresa_endereco:   briefing.empresa_endereco,
        empresa_ig:         briefing.empresa_ig || '—',
        empresa_fb:         briefing.empresa_fb || '—',
        empresa_site_atual: briefing.empresa_site_atual || '—',
        // Identidade
        cor_principal:      briefing.cor_principal,
        cor_secundaria:     briefing.cor_secundaria,
        estilo:             briefing.estilo,
        vibe:               briefing.vibe || '—',
        sentimento:         briefing.sentimento || '—',
        // Conteúdo
        objetivo:           briefing.objetivo,
        descricao:          briefing.descricao,
        publico:            briefing.publico,
        diferenciais:       briefing.diferenciais || '—',
        nao_quero:          briefing.nao_quero || '—',
        funcionalidades:    briefing.funcionalidades,
        referencias:        briefing.referencias || '—',
        // Domínio / responsável
        resp_nome:          briefing.resp_nome,
        resp_nascimento:    briefing.resp_nascimento,
        resp_cpf:           briefing.resp_cpf,
        resp_rg:            briefing.resp_rg,
        dominio_desejado:   briefing.dominio_desejado || '—',
        // Extras
        obs:                briefing.obs || '—',
        data_envio:         briefing.data_envio,
        reply_to:           briefing.empresa_email,
        // Prompt pronto para IA (copiar e colar)
        ai_prompt:          briefing.ai_prompt || '',
        // Código gerado pelo Claude
        site_code:          siteCode.slice(0, 50000),
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

  } catch (err) {
    console.error('Erro EmailJS:', err);
    // Retorna sucesso parcial — código foi gerado mas e-mail falhou
    return new Response(
      JSON.stringify({
        success: false,
        warning: `Site gerado mas e-mail falhou: ${err.message}`,
        code: siteCode,
      }),
      { status: 207, headers: corsHeaders }
    );
  }

  // ════════════════════════════════════════
  // 4. TUDO CERTO
  // ════════════════════════════════════════
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: corsHeaders }
  );
}