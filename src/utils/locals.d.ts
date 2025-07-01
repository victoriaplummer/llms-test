import type { MinimalKV } from "./types";

declare global {
  interface Locals {
    webflowContent: MinimalKV;
    exposureSettings: MinimalKV;
  }
}
