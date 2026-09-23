"use client";

import Image from "next/image";
import { createOrder } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { StoreSettings } from "@/lib/types";
import { buildWhatsAppLink, buildWhatsAppMessage } from "@/lib/whatsapp";
import { CartIcon } from "@/components/icons";
import { trackEvent } from "@/lib/analytics";

interface CartDrawerProps {
  settings: StoreSettings;
  onClose: () => void;
}

export default function CartDrawer({ settings, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalPrice = useCartStore((s) => s.totalPrice());

  function handleCheckout() {
    const message = buildWhatsAppMessage(items, settings.currency);
    const link = buildWhatsAppLink(settings.whatsapp_number, message);
    // Open WhatsApp synchronously so the browser still attributes the popup
    // to this click; logging happens in the background and never blocks it.
    window.open(link, "_blank");
    trackEvent("checkout_whatsapp", { total: totalPrice, items: items.length });
    createOrder(items);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-md flex-col bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold uppercase tracking-wide">
            <CartIcon className="h-5 w-5" />
            Panier
          </h2>
          <button onClick={onClose} className="text-lg font-bold">
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="text-neutral-500">Votre panier est vide.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.cartId} className="flex gap-3 rounded-xl bg-card p-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-neutral-500">{item.brand}</p>
                        <p className="text-sm font-bold leading-tight">{item.name}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.cartId)}
                        className="text-xs font-semibold text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Pointure {item.size} · {item.withBox ? "Avec coffret" : "Sans coffret"}
                    </p>
                    {item.colorNote && (
                      <p className="text-xs text-neutral-600">Couleur : {item.colorNote}</p>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          className="font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          className="font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {(item.unitPrice * item.quantity).toLocaleString("fr-FR")} {settings.currency}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-200 p-5">
            <div className="mb-3 flex items-center justify-between text-base font-bold">
              <span>Total</span>
              <span>
                {totalPrice.toLocaleString("fr-FR")} {settings.currency}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full rounded-full bg-green-600 px-4 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              Commander via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
