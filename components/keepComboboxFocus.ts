import type { MouseEvent } from "react";

/** Keep combobox input focused until click completes (required for Safari listboxes). */
export const keepComboboxFocus = (e: MouseEvent) => e.preventDefault();
