export const config = { runtime: 'edge' };

const RESEND_API = 'https://api.resend.com/emails';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

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
    return new Response(JSON.stringify({ error: 'Payload inválido.' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // ════════════════════════════════════════
  // MONTA O HTML DO E-MAIL
  // ════════════════════════════════════════
  const emailHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Novo Briefing — ${briefing.empresa_nome}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Arial,sans-serif;color:#f0ece6;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px;">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:#161616;border:1px solid #2a2a2a;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
        <p style="margin:0 0 16px;font-size:13px;color:#b0a9a2;letter-spacing:1px;text-transform:uppercase;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e05e1b;margin-right:8px;vertical-align:middle;"></span>
          Novo Briefing Recebido
        </p>
        <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;letter-spacing:-1px;color:#f0ece6;">${escapeHtml(briefing.empresa_nome)}</h1>
        <p style="margin:0;font-size:14px;color:#7a7470;">${escapeHtml(briefing.empresa_segmento)} &nbsp;·&nbsp; ${escapeHtml(briefing.data_envio)}</p>
      </td></tr>

      <!-- EMPRESA -->
      <tr><td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${sectionTitle('🏢', 'Dados da Empresa')}
          ${row('Nome Fantasia', briefing.empresa_nome)}
          ${row('Razão Social', briefing.empresa_razao)}
          ${row('CNPJ', briefing.empresa_cnpj)}
          ${row('Segmento', briefing.empresa_segmento)}
          ${row('Telefone / WhatsApp', briefing.empresa_tel)}
          ${row('E-mail', briefing.empresa_email)}
          ${row('Instagram', briefing.empresa_ig)}
          ${row('Facebook', briefing.empresa_fb)}
          ${row('Endereço', briefing.endereco_completo)}
        </table>
      </td></tr>

      <!-- RESPONSÁVEL -->
      <tr><td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${sectionTitle('👤', 'Dados do Responsável')}
          ${row('Nome Completo', briefing.resp_nome)}
          ${row('Nascimento', briefing.resp_nascimento)}
          ${row('CPF', briefing.resp_cpf)}
          ${row('RG', briefing.resp_rg)}
          ${row('Telefone', briefing.resp_tel)}
          ${row('E-mail', briefing.resp_email)}
        </table>
      </td></tr>

      <!-- IDENTIDADE VISUAL -->
      <tr><td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${sectionTitle('🎨', 'Identidade Visual')}
          <tr><td style="padding:0 0 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:6px;">
                  <div style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:8px;padding:14px;text-align:center;">
                    <div style="width:40px;height:40px;border-radius:8px;background:${escapeHtml(briefing.cor_principal)};margin:0 auto 8px;border:1px solid rgba(255,255,255,0.1);"></div>
                    <div style="font-size:11px;color:#7a7470;text-transform:uppercase;letter-spacing:0.5px;">Cor Principal</div>
                    <div style="font-size:14px;font-weight:600;color:#f0ece6;margin-top:2px;">${escapeHtml(briefing.cor_principal)}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:6px;">
                  <div style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:8px;padding:14px;text-align:center;">
                    <div style="width:40px;height:40px;border-radius:8px;background:${escapeHtml(briefing.cor_secundaria)};margin:0 auto 8px;border:1px solid rgba(255,255,255,0.1);"></div>
                    <div style="font-size:11px;color:#7a7470;text-transform:uppercase;letter-spacing:0.5px;">Cor Secundária</div>
                    <div style="font-size:14px;font-weight:600;color:#f0ece6;margin-top:2px;">${escapeHtml(briefing.cor_secundaria)}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
          ${row('Estilo Visual', briefing.estilo)}
          ${row('Vibe da Marca', briefing.vibe)}
        </table>
      </td></tr>

      <!-- CONTEÚDO -->
      <tr><td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${sectionTitle('✏️', 'Conteúdo & Funcionalidades')}
          ${row('Objetivo', briefing.objetivo)}
          ${row('Público-alvo', briefing.publico_alvo)}
          ${rowBlock('Descrição do Negócio', briefing.descricao)}
          ${row('Funcionalidades', briefing.funcionalidades)}
          ${rowBlock('Referências', briefing.referencias)}
          ${rowBlock('Observações', briefing.obs)}
        </table>
      </td></tr>

      <!-- PROMPT IA -->
      <tr><td style="background:#161616;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:0 40px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${sectionTitle('🤖', 'Prompt para IA')}
          <tr><td style="padding-bottom:28px;">
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid #e05e1b;border-radius:8px;padding:18px;font-size:12px;color:#b0a9a2;white-space:pre-wrap;word-break:break-word;line-height:1.6;font-family:monospace;">${escapeHtml(briefing.prompt_ia)}</div>
          </td></tr>
        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#111111;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#7a7470;">VAI Personalizados &nbsp;·&nbsp; ${escapeHtml(briefing.data_envio)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#7a7470;">Responder para: <a href="mailto:${escapeHtml(briefing.empresa_email)}" style="color:#e05e1b;text-decoration:none;">${escapeHtml(briefing.empresa_email)}</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  // ════════════════════════════════════════
  // ENVIA VIA RESEND
  // ════════════════════════════════════════
  try {
    const resendRes = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // "from" precisa ser um domínio verificado no Resend.
        // Se ainda não tiver domínio próprio, use: onboarding@resend.dev (só envia pra seu próprio e-mail)
        from: process.env.EMAIL_FROM,
        to:   [process.env.EMAIL_DESTINO],
        reply_to: briefing.empresa_email,
        subject: `📋 Novo briefing — ${briefing.empresa_nome} (${briefing.empresa_segmento})`,
        html: emailHTML,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      throw new Error(`Resend ${resendRes.status}: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error('Erro Resend:', err);
    return new Response(
      JSON.stringify({ error: `Falha ao enviar e-mail: ${err.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function escapeHtml(str) {
  return String(str ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sectionTitle(emoji, title) {
  return `
    <tr><td style="padding:24px 0 14px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:11px;font-weight:700;color:#7a7470;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #2a2a2a;padding-bottom:12px;">
            ${emoji}&nbsp;&nbsp;${title}
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function row(label, value) {
  if (!value || value === '—') return '';
  return `
    <tr><td style="border-bottom:1px solid #1e1e1e;padding:2px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="160" style="font-size:12px;color:#7a7470;padding:7px 0;vertical-align:top;">${label}</td>
          <td style="font-size:13px;color:#f0ece6;padding:7px 0;vertical-align:top;word-break:break-word;">${escapeHtml(String(value))}</td>
        </tr>
      </table>
    </td></tr>`;
}

function rowBlock(label, value) {
  if (!value || value === '—') return '';
  return `
    <tr><td style="padding:10px 0;border-bottom:1px solid #1e1e1e;">
      <div style="font-size:12px;color:#7a7470;margin-bottom:8px;">${label}</div>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:12px 14px;font-size:13px;color:#f0ece6;line-height:1.65;white-space:pre-wrap;word-break:break-word;">${escapeHtml(String(value))}</div>
    </td></tr>`;
}