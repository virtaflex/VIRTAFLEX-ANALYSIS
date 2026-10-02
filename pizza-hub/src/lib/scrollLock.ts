/** Reference-counted body scroll lock, so overlapping overlays don't unlock each other. */
let locks = 0;
export function lockScroll() {
  locks += 1;
  document.body.classList.add('no-scroll');
}
export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.body.classList.remove('no-scroll');
}
