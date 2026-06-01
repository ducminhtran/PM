/** Avatar — image with initials fallback and deterministic color. */
import { el } from '../utils/dom.js';
import { initials, hashHue } from '../utils/format.js';

export function Avatar({ name = 'Unassigned', url, size = 28 } = {}) {
  const node = el('span.avatar', {
    title: name,
    style: { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.4)}px` },
  });
  if (url) {
    node.append(el('img.avatar__img', { src: url, alt: name }));
  } else {
    node.style.background = `hsl(${hashHue(name)} 45% 88%)`;
    node.style.color = `hsl(${hashHue(name)} 45% 30%)`;
    node.append(el('span', { text: initials(name) || '?' }));
  }
  return node;
}
