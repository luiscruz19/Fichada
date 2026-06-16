// El panel se sirve bajo este prefijo (debe coincidir con basePath en next.config.mjs).
// Los fetch del cliente al propio backend (route handlers /api/*) deben prefijarse con esto:
// el navegador no aplica basePath automáticamente a fetch().
export const BASE_PATH = '/backoffice';
