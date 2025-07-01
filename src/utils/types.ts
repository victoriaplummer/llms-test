/**
 * Minimal KV interface for our KV operations
 */
export interface MinimalKV {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor: string;
  }>;
}
