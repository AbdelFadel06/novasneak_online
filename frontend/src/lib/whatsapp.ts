import { CartItem } from "./types";

export function buildWhatsAppMessage(items: CartItem[], currency: string): string {
  const lines: string[] = ["Bonjour, je souhaite commander :", ""];

  items.forEach((item, index) => {
    const total = item.unitPrice * item.quantity;
    lines.push(`${index + 1}. ${item.brand} ${item.name}`);
    lines.push(`   Pointure : ${item.size}`);
    lines.push(`   Coffret : ${item.withBox ? "Oui" : "Non"}`);
    lines.push(`   Quantite : ${item.quantity}`);
    if (item.colorNote) lines.push(`   Couleur souhaitee : ${item.colorNote}`);
    lines.push(`   Sous-total : ${total.toLocaleString("fr-FR")} ${currency}`);
    lines.push("");
  });

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  lines.push(`Total : ${total.toLocaleString("fr-FR")} ${currency}`);

  return lines.join("\n");
}

export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
