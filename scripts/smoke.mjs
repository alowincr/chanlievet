/**
 * Smoke tests de solo lectura contra el API de ChanlieVet.
 *
 * Uso:
 *   npm run smoke
 *   API_URL=http://localhost:4000 npm run smoke
 *
 * No crea citas ni modifica datos: valida endpoints públicos, autenticación,
 * permisos, validaciones y cabeceras defensivas.
 */
const API = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body, headers: response.headers };
}

try {
  let response = await request("/api/health");
  check("GET /api/health", response.status === 200 && response.body?.ok === true);
  check(
    "Cabeceras defensivas",
    response.headers.get("x-content-type-options") === "nosniff" &&
      response.headers.get("x-frame-options") === "DENY" &&
      response.headers.get("referrer-policy") === "no-referrer",
  );

  response = await request("/api/categories");
  check(
    "GET /api/categories",
    response.status === 200 && (response.body?.categories?.length ?? 0) > 0,
    `${response.body?.categories?.length ?? 0} categorías`,
  );

  response = await request("/api/products?limit=60");
  const products = response.body?.products ?? [];
  check("GET /api/products", response.status === 200 && products.length > 0, `${products.length} productos`);
  check(
    "Slugs e imágenes de producto válidos",
    products.every(
      (product) =>
        typeof product.slug === "string" &&
        product.slug.length > 0 &&
        (!product.imageUrl || /^https?:\/\//.test(product.imageUrl)),
    ),
  );

  if (products[0]) {
    response = await request(`/api/products/${products[0].slug}`);
    check(
      "GET /api/products/:slug",
      response.status === 200 && response.body?.product?.id === products[0].id,
    );
  }

  response = await request("/api/products/no-existe-xyz");
  check("Producto inexistente => 404", response.status === 404);

  response = await request("/api/services");
  check(
    "GET /api/services",
    response.status === 200 && (response.body?.services?.length ?? 0) > 0,
    `${response.body?.services?.length ?? 0} servicios`,
  );

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  response = await request(
    `/api/appointments/availability?date=${tomorrow}&serviceId=1`,
  );
  check(
    "GET /api/appointments/availability",
    response.status === 200 && Array.isArray(response.body?.availableSlots),
    `${response.body?.availableSlots?.length ?? 0} franjas`,
  );

  response = await request("/api/appointments/availability?date=mal");
  check("Disponibilidad con fecha inválida => 400", response.status === 400);

  response = await request("/api/queue");
  const publicQueue = JSON.stringify(response.body?.queue ?? {});
  check(
    "Cola pública sin teléfonos ni códigos",
    response.status === 200 &&
      !/CV-[A-Z0-9]{6}/.test(publicQueue) &&
      !/9\d{8}/.test(publicQueue),
  );

  response = await request("/api/queue/staff");
  check("GET /api/queue/staff sin token => 401", response.status === 401);

  response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@chanlievet.pe",
      password: "incorrecta",
    }),
  });
  check("Login con contraseña incorrecta => 401", response.status === 401);

  response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@chanlievet.pe",
      password: "chanlievet123",
    }),
  });
  check(
    "Login del administrador",
    response.status === 200 && Boolean(response.body?.token),
    response.body?.user?.role,
  );

  const auth = { Authorization: `Bearer ${response.body?.token}` };

  response = await request("/api/auth/me", { headers: auth });
  check(
    "GET /api/auth/me",
    response.status === 200 && response.body?.user?.email === "admin@chanlievet.pe",
  );

  response = await request("/api/admin/stats", { headers: auth });
  check(
    "GET /api/admin/stats",
    response.status === 200 &&
      response.body?.stats?.totals?.products !== undefined,
  );

  response = await request("/api/admin/products", { headers: auth });
  check(
    "GET /api/admin/products",
    response.status === 200 && response.body?.products?.length === products.length,
  );

  response = await request("/api/admin/patients", { headers: auth });
  check(
    "GET /api/admin/patients",
    response.status === 200 && Array.isArray(response.body?.patients),
  );

  response = await request("/api/admin/staff", { headers: auth });
  check(
    "GET /api/admin/staff",
    response.status === 200 && Array.isArray(response.body?.staff),
  );

  response = await request("/api/appointments", { headers: auth });
  check(
    "GET /api/appointments (staff)",
    response.status === 200 && Array.isArray(response.body?.appointments),
  );

  response = await request("/api/admin/products/1", {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ imageUrl: "no-es-url" }),
  });
  check("URL de imagen inválida => 400", response.status === 400);

  response = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad json",
  });
  check("JSON mal formado => 400", response.status === 400);

  response = await request("/api/ruta-inexistente");
  check("Ruta inexistente => 404 JSON", response.status === 404 && Boolean(response.body?.error));
} catch (error) {
  console.error("\nNo se pudo completar la prueba:", error.message);
  console.error("¿Está el API levantado en", API, "?");
  process.exitCode = 1;
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} pruebas correctas`);
if (failed.length > 0) process.exitCode = 1;
