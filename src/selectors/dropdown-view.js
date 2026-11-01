/** @import {ListOption} from './list-builder.js' */

/**
 * Render a reusable, accessible native HTML select once; update its options
 * without replacing the select element (which preserves focus).
 *
 * @param {HTMLElement} host
 * @param {{
 *   id: string,
 *   label: string,
 *   placeholder: string,
 *   onChange: (value: string) => void,
 * }} config
 * @returns {{element: HTMLSelectElement, update: (options: readonly ListOption[], value?: string) => void}}
 */
export function createDropdown(host, { id, label, placeholder, onChange }) {
  const wrapper = document.createElement("div");
  wrapper.className = "control-group";
  const labelElement = document.createElement("label");
  labelElement.htmlFor = id;
  labelElement.textContent = label;
  const select = document.createElement("select");
  select.id = id;
  select.name = id;
  wrapper.append(labelElement, select);
  host.append(wrapper);

  select.addEventListener("change", () => onChange(select.value));

  /** @param {readonly ListOption[]} options @param {string} [value] */
  function update(options, value = "") {
    const items = [new Option(placeholder, ""), ...options.map((item) => new Option(item.label, item.value))];
    select.replaceChildren(...items);
    select.value = value && options.some((option) => option.value === value) ? value : "";
    select.disabled = options.length === 0;
  }
  update([]);
  return { element: select, update };
}

/**
 * Make a reusable accessible text filter that remains mounted while searching.
 * @param {HTMLElement} host
 * @param {{id: string, label: string, placeholder: string, onInput: (value: string) => void}} config
 * @returns {HTMLInputElement}
 */
export function createTextFilter(host, { id, label, placeholder, onInput }) {
  const wrapper = document.createElement("div");
  wrapper.className = "control-group";
  const labelElement = document.createElement("label");
  labelElement.htmlFor = id;
  labelElement.textContent = label;
  const input = document.createElement("input");
  input.id = id;
  input.name = id;
  input.type = "search";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.addEventListener("input", () => onInput(input.value));
  wrapper.append(labelElement, input);
  host.append(wrapper);
  return input;
}
