// The app's single entry point for zod. Some schemas also run in the
// browser, where zod would otherwise probe for eval once; the content
// security policy blocks that (zod copes, but the browser logs a violation).
// Import z from here, never from "zod" directly.
import { z } from "zod";

z.config({ jitless: true });

export { z };
