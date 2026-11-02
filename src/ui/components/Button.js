import { el } from "./Element.js";
export function Button(label, onClick, { variant = "secondary-button", disabled = false, title } = {}) {
  return el("button", { type:"button", className:variant, text:label, onClick, disabled, title });
}
