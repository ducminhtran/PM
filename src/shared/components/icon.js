/**
 * icon.js — bộ icon SVG nội bộ (thay cho Tabler webfont qua CDN).
 *
 * Vì sao: webfont tải từ CDN ngoài gây chập chờn (icon trống một lúc rồi mới
 * hiện) và phụ thuộc mạng. Nhúng thẳng path SVG của các icon app dùng (chỉ
 * ~20 cái) khiến icon hiển thị tức thì, không cần tải gì, chạy cả khi offline.
 *
 * Các path lấy từ Tabler Icons (giấy phép MIT) — đúng bộ icon đang dùng,
 * chỉ khác cách nạp. Tất cả vẽ trên lưới 24x24, nét 2px, bo tròn đầu nét.
 *
 * Dùng: Icon('folder')  ->  <svg> ... </svg>  (kế thừa màu/cỡ từ phần tử cha)
 */

// Mỗi entry là nội dung BÊN TRONG <svg> (path/line/circle...).
const PATHS = {
  'layout-dashboard': '<path d="M4 4h6v8h-6z"/><path d="M4 16h6v4h-6z"/><path d="M14 12h6v8h-6z"/><path d="M14 4h6v4h-6z"/>',
  'folder': '<path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/>',
  'folder-plus': '<path d="M12 19h-7a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v3.5"/><path d="M16 19h6"/><path d="M19 16v6"/>',
  'folder-x': '<path d="M12 19h-7a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v4"/><path d="M22 22l-5 -5"/><path d="M17 22l5 -5"/>',
  'checklist': '<path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8"/><path d="M14 19l2 2l4 -4"/><path d="M9 8h4"/><path d="M9 12h2"/>',
  'bug': '<path d="M9 9v-1a3 3 0 0 1 6 0v1"/><path d="M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3"/><path d="M3 13l4 0"/><path d="M17 13l4 0"/><path d="M12 20l0 -6"/><path d="M4 19l3.35 -2"/><path d="M20 19l-3.35 -2"/><path d="M4 7l3.75 2.4"/><path d="M20 7l-3.75 2.4"/>',
  'users': '<path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>',
  'plus': '<path d="M12 5l0 14"/><path d="M5 12l14 0"/>',
  'search': '<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/>',
  'x': '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>',
  'arrow-left': '<path d="M5 12l14 0"/><path d="M5 12l6 6"/><path d="M5 12l6 -6"/>',
  'arrow-up': '<path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/>',
  'arrow-up-right': '<path d="M17 7l-10 10"/><path d="M8 7l9 0l0 9"/>',
  'chevron-down': '<path d="M6 9l6 6l6 -6"/>',
  'equal': '<path d="M5 10h14"/><path d="M5 14h14"/>',
  'check': '<path d="M5 12l5 5l10 -10"/>',
  'alert-triangle': '<path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z"/><path d="M12 16h.01"/>',
  'alert-circle': '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  'alert': '<path d="M12 8v4"/><path d="M12 16h.01"/><path d="M12 3l9 16h-18z" transform="translate(0 1)"/>',
  'info-circle': '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/>',
  'circle': '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>',
};

const FALLBACK = PATHS.circle;

/**
 * Tạo một icon SVG.
 * @param {string} name - tên icon (vd 'folder'); không có thì dùng vòng tròn.
 * @param {object} [opts]
 * @param {number} [opts.size=20] - cỡ px
 * @param {string} [opts.className] - class thêm vào (vd 'spin')
 * @returns {SVGElement}
 */
export function Icon(name, { size = 20, className } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');      // kế thừa màu chữ của cha
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('icon');
  if (className) svg.classList.add(className);
  svg.innerHTML = PATHS[name] ?? FALLBACK;        // markup tĩnh, an toàn
  return svg;
}
