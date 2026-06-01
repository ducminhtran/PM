/**
 * dom.js — tiny DOM helpers.
 *
 * Goal: build UI without inline onclick and without string-concatenated
 * innerHTML (which invites XSS and breaks event binding). `el()` creates
 * elements declaratively; event handlers are real functions, not strings.
 */

/**
 * Create an element.
 * @param {string} tag - 'div', 'button.primary#id', etc. (supports .class and #id)
 * @param {object} [props] - attributes, plus { on: { click: fn }, dataset, style, html, text }
 * @param {(Node|string|null|Array)} [children]
 */
export function el(tag, props = {}, children = []) {
  const { tagName, id, classes } = parseTag(tag);
  const node = document.createElement(tagName);
  if (id) node.id = id;
  if (classes.length) node.classList.add(...classes);

  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'on') {
      for (const [evt, fn] of Object.entries(value)) node.addEventListener(evt, fn);
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key === 'style' && typeof value === 'object') {
      for (const [prop, val] of Object.entries(value)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, val);
        else node.style[prop] = val;
      }
    } else if (key === 'class') {
      node.classList.add(...String(value).split(' ').filter(Boolean));
    } else if (key === 'html') {
      node.innerHTML = value; // only use with trusted/static markup
    } else if (key === 'text') {
      node.textContent = value;
    } else if (key in node && key !== 'list') {
      node[key] = value;
    } else {
      node.setAttribute(key, value);
    }
  }

  appendChildren(node, children);
  return node;
}

function parseTag(tag) {
  const idMatch = tag.match(/#([\w-]+)/);
  const classMatches = [...tag.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const tagName = tag.match(/^[\w-]+/)?.[0] || 'div';
  return { tagName, id: idMatch?.[1], classes: classMatches };
}

function appendChildren(node, children) {
  const arr = Array.isArray(children) ? children : [children];
  for (const child of arr) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Replace all children of a container with new nodes. */
export function mount(container, ...nodes) {
  container.replaceChildren(...nodes.flat().filter(Boolean));
}

/** Query helpers. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Build a fragment from an array (handy for lists). */
export function fragment(nodes) {
  const f = document.createDocumentFragment();
  appendChildren(f, nodes);
  return f;
}
