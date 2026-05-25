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
};

type WhatsAppConfirmationLinkInput = {
  barbershopName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
};

function normalizeWhatsAppPhone(phone: string) {
  return phone.replace(/\D/g, "");
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
}: WhatsAppConfirmationLinkInput) {
  const normalizedPhone = normalizeWhatsAppPhone(clientPhone);
  const messageLines = [
    `Hola ${clientName}, te confirmamos tu turno en ${barbershopName}.`,
    `Servicio: ${serviceName}`,
    `Fecha: ${date}`,
    `Horario: ${time}`,
    "",
    "Por favor, avisa con al menos 1 hora de anticipacion si necesitas cancelar.",
  ];

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    messageLines.join("\n"),
  )}`;
}
