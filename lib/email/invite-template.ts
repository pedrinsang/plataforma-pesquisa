import { formatInviteCode } from "@/lib/invites/format";

const ROLE_LABELS: Record<string, string> = {
  owner: "dono",
  editor: "editor",
  viewer: "leitor",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function inviteEmail({
  projectTitle,
  inviterName,
  role,
  link,
  code,
}: {
  projectTitle: string;
  inviterName: string | null;
  role: string;
  link: string;
  code: string;
}): { subject: string; html: string; text: string } {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const who = inviterName?.trim() || "Alguém";
  const prettyCode = formatInviteCode(code);
  const subject = `Convite para o projeto "${projectTitle}" no Folium`;

  const text = [
    `${who} convidou você para participar do projeto "${projectTitle}" no Folium como ${roleLabel}.`,
    "",
    `Para aceitar, abra: ${link}`,
    `Ou entre no Folium e use o código: ${prettyCode}`,
    "",
    "Se você não esperava este convite, ignore este e-mail.",
  ].join("\n");

  // HTML de e-mail: tabela + estilo inline (é o que os clientes de e-mail
  // renderizam com previsibilidade). Paleta Folium: papel quente + petróleo.
  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f7f4ef;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf9;border:1px solid #e3ddd2;border-radius:12px;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#146b74;letter-spacing:.02em;">Folium</p>
                <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8177;">Convite de participação</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0;">
                <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:#241f1a;line-height:1.25;">
                  ${escapeHtml(projectTitle)}
                </h1>
                <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;line-height:1.65;color:#4a423a;">
                  ${escapeHtml(who)} convidou você para participar deste projeto de pesquisa como
                  <strong style="color:#146b74;font-weight:600;">${escapeHtml(roleLabel)}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 20px;">
                <a href="${escapeHtml(link)}"
                   style="display:inline-block;padding:11px 26px;border:1px solid #146b74;border-radius:8px;background:#146b74;color:#fffdf9;font-family:Georgia,serif;font-size:15px;text-decoration:none;">
                  Aceitar convite
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;color:#8a8177;text-align:center;">
                  Ou entre no Folium e use o código
                </p>
                <p style="margin:0;text-align:center;font-family:'Courier New',monospace;font-size:19px;letter-spacing:.16em;color:#241f1a;">
                  ${escapeHtml(prettyCode)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 26px;border-top:1px solid #e3ddd2;">
                <p style="margin:0;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#8a8177;">
                  Se você não esperava este convite, pode ignorar este e-mail — sem o link ou o
                  código ninguém entra no projeto.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
