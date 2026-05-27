type WhatsAppBookingLinkInput = {
  barbershopName: string;
  barbershopWhatsapp: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  barberName?: string;
  date: string;
  time: string;
  comment?: string;
  /**
   * Si se provee, agrega al mensaje el link público de detalle/confirmación
   * del turno. Esto permite al admin abrir el link desde el mismo WhatsApp
   * del cliente y confirmar sin entrar al panel.
   */
  confirmationToken?: string;
};

type WhatsAppConfirmationLinkInput = {
  barbershopName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  /**
   * Token único del turno. Si se provee, el mensaje incluye un link
   * a `/r/[token]` para que el cliente confirme o cancele desde la web.
   */
  confirmationToken?: string;
};

function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

/**
 * Construye la URL pública para que el cliente RESPONDA (confirme o
 * cancele) su turno desde un click. Apunta a `/r/[token]/responder`.
 *
 * Para la vista pasiva (solo detalle, sin botones) usar directamente
 * `/r/[token]` desde la pantalla de éxito post-reserva.
 */
function getResponderUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/r/${token}/responder`;
}

export function createWhatsAppBookingLink({
  barbershopName,
  barbershopWhatsapp,
  clientName,
  clientPhone,
  serviceName,
  barberName,
  date,
  time,
  comment,
  confirmationToken,
}: WhatsAppBookingLinkInput) {
  const normalizedPhone = normalizeWhatsAppPhone(barbershopWhatsapp);
  const messageLines = [
    `Hola, quiero reservar un turno en ${barbershopName}.`,
    "",
    `Nombre: ${clientName}`,
    `Telefono: ${clientPhone}`,
    `Servicio: ${serviceName}`,
  ];

  if (barberName) {
    messageLines.push(`Barbero: ${barberName}`);
  }

  messageLines.push(`Fecha: ${date}`, `Horario: ${time}`);

  if (comment?.trim()) {
    messageLines.push(`Comentario: ${comment.trim()}`);
  }

  if (confirmationToken) {
    messageLines.push(
      "",
      "Detalle y confirmar:",
      getResponderUrl(confirmationToken),
    );
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    messageLines.join("\n"),
  )}`;
}

export function createWhatsAppConfirmationLink({
  barbershopName,
  clientName,
  clientPhone,
  serviceName,
  date,
  time,
  confirmationToken,
}: WhatsAppConfirmationLinkInput) {
  const normalizedPhone = normalizeWhatsAppPhone(clientPhone);
  const messageLines = [
    `Hola ${clientName}, te recordamos tu turno en ${barbershopName}.`,
    "",
    `Servicio: ${serviceName}`,
    `Fecha: ${date}`,
    `Horario: ${time}`,
  ];

  if (confirmationToken) {
    messageLines.push(
      "",
      "Confirmá o cancelá tu turno con un click:",
      getResponderUrl(confirmationToken),
    );
  } else {
    messageLines.push(
      "",
      "Por favor, avisa con al menos 1 hora de anticipacion si necesitas cancelar.",
    );
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    messageLines.join("\n"),
  )}`;
}
