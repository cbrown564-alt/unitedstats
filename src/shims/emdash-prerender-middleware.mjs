// Prerender stub for EmDash's middleware: prerendered pages read the committed
// seed and never touch EmDash, so its request pipeline is skipped on Node.
export const onRequest = (_context, next) => next();
