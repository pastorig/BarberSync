type WhatsAppBookingLinkInput = {
  barbershopName: string;
  barbershopWhatsapp: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  comment?: string;
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
    `Fecha: ${date}`,
    `Horario: ${time}`,
  ];

  if (comment?.trim()) {
    messageLines.push(`Comentario: ${comment.trim()}`);
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    messageLines.join("\n"),
  )}`;
}
