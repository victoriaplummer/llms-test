import { JSDOM } from "jsdom";

// Create a JSDOM instance for DOM operations
const dom = new JSDOM("");
export const { HTMLElement, HTMLAnchorElement } = dom.window;
