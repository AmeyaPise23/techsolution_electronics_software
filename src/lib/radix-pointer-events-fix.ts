/**
 * Radix UI (Select / Popover / Dropdown / Dialog) sets `pointer-events: none`
 * on `<body>` while an overlay is open to lock the page. In some flows —
 * especially when a click that dismisses the overlay lands on an element that
 * unmounts, or when React re-renders during the close animation — the shim
 * never gets cleaned up. `<body>` is left with inline `pointer-events: none`
 * and every subsequent click on the page is silently swallowed, which reads to
 * users as "the screen went blank / stopped responding".
 *
 * This module installs a single MutationObserver that watches `body`'s inline
 * style: any time it sees `pointer-events: none` while no Radix overlay is
 * actually open in the DOM, it removes the inline style. Cheap, idempotent,
 * and safe — when an overlay is open we leave the shim alone.
 */
export function installRadixPointerEventsFix() {
  if (typeof document === "undefined") return;
  if ((window as unknown as { __radixPeFix?: boolean }).__radixPeFix) return;
  (window as unknown as { __radixPeFix?: boolean }).__radixPeFix = true;

  const RADIX_OVERLAY_SELECTOR =
    '[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"], [data-state="open"][role="menu"], [data-state="open"][role="listbox"]';

  const clearIfStale = () => {
    const style = document.body.getAttribute("style") ?? "";
    if (!style.includes("pointer-events")) return;
    const overlayOpen = document.querySelector(RADIX_OVERLAY_SELECTOR);
    if (overlayOpen) return;
    document.body.style.pointerEvents = "";
    if (!document.body.getAttribute("style")) {
      document.body.removeAttribute("style");
    }
  };

  const observer = new MutationObserver(clearIfStale);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
  });

  // In case of races (Radix mutates body, then unmounts overlay in the same tick).
  window.addEventListener("focus", clearIfStale);
  document.addEventListener("visibilitychange", clearIfStale);
}
