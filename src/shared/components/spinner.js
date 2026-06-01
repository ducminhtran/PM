/** Spinner — pure presentational loading indicator. */
import { el } from '../utils/dom.js';

export function Spinner({ label } = {}) {
  return el('div.spinner', {}, [
    el('div.spinner__ring', { 'aria-hidden': 'true' }),
    label && el('span.spinner__label', { text: label }),
  ]);
}
