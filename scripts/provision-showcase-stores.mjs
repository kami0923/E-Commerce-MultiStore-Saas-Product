import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const showcases = [
  {
    tenant: "ForgeLine Hardware", slug: "forgeline-hardware", vertical: "HARDWARE", theme: "forge",
    categories: [["Power & Performance", "power-performance"], ["Hand Tool Essentials", "hand-tools"], ["Site & Safety", "site-safety"]],
    products: [
      ["Impact Driver X18", "impact-driver-x18", "Power & Performance", "FORGE-X18", 3499900, 16, "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1200&q=88", "Brushless 18V impact driver engineered for controlled torque and long site days."],
      ["108-Piece Master Tool Set", "master-tool-set-108", "Hand Tool Essentials", "FORGE-108", 1899900, 24, "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=88", "A workshop-ready hand tool system arranged in a durable precision case."],
      ["ProCut Circular Saw", "procut-circular-saw", "Power & Performance", "FORGE-SAW", 4299900, 11, "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=88", "High-output circular saw with stable depth control and job-site durability."],
    ],
  },
  {
    tenant: "Veloura Cosmetics", slug: "veloura-cosmetics", vertical: "COSMETICS", theme: "velvet",
    categories: [["Skin Ritual", "skin-ritual"], ["Colour Studio", "colour-studio"], ["Glow Edit", "glow-edit"]],
    products: [
      ["Midnight Rose Serum", "midnight-rose-serum", "Skin Ritual", "VELO-SERUM", 899900, 32, "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=88", "A luminous overnight serum with a silk-light finish for calm, hydrated skin."],
      ["Velvet Lip Colour", "velvet-lip-colour", "Colour Studio", "VELO-LIP", 449900, 45, "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=88", "Saturated colour, soft-focus comfort and a modern velvet finish."],
      ["Moonlit Glow Palette", "moonlit-glow-palette", "Glow Edit", "VELO-GLOW", 699900, 27, "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=88", "A sculpted trio of buildable light for subtle radiance or evening brilliance."],
    ],
  },
  {
    tenant: "Northbound Outfitters", slug: "northbound-outfitters", vertical: "CLOTHING", theme: "midnight",
    categories: [["Weather Systems", "weather-systems"], ["City Layers", "city-layers"], ["Trail Insulation", "trail-insulation"]],
    products: [
      ["Alpine Storm Shell", "alpine-storm-shell", "Weather Systems", "NORTH-SHELL", 2499900, 18, "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=88", "A seam-sealed technical shell balancing weather protection with everyday movement."],
      ["Transit Bomber Jacket", "transit-bomber-jacket", "City Layers", "NORTH-BOMBER", 1899900, 21, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=88", "A refined utility bomber built for cool commutes and late-night city movement."],
      ["Ridge Insulated Parka", "ridge-insulated-parka", "Trail Insulation", "NORTH-PARKA", 3299900, 14, "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=1200&q=88", "Warm, lightweight insulation with a protective silhouette for colder routes."],
    ],
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? undefined : { rejectUnauthorized: false } });

async function provision(client, showcase, planId) {
  const tenantId = randomUUID();
  const tenant = await client.query(`INSERT INTO "Tenant" ("id","name","slug","status","countryCode","baseCurrency","defaultLocale","createdAt","updatedAt") VALUES ($1,$2,$3,'ACTIVE','PK','PKR','en',NOW(),NOW()) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name", "status"='ACTIVE', "updatedAt"=NOW() RETURNING "id"`, [tenantId, showcase.tenant, showcase.slug]);
  const actualTenantId = tenant.rows[0].id;
  const storeId = randomUUID();
  const store = await client.query(`INSERT INTO "Store" ("id","tenantId","name","slug","status","vertical","currency","defaultLocale","enabledLocales","themeKey","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'ACTIVE',$5::"StoreVertical",'PKR','en',$6::jsonb,$7,NOW(),NOW()) ON CONFLICT ("tenantId","slug") DO UPDATE SET "name"=EXCLUDED."name", "status"='ACTIVE', "vertical"=EXCLUDED."vertical", "themeKey"=EXCLUDED."themeKey", "updatedAt"=NOW() RETURNING "id"`, [storeId, actualTenantId, showcase.tenant, showcase.slug, showcase.vertical, JSON.stringify(["en", "ur"]), showcase.theme]);
  const actualStoreId = store.rows[0].id;

  const periodEnd = new Date(); periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  await client.query(`INSERT INTO "TenantSubscription" ("id","tenantId","planId","status","currentPeriodStart","currentPeriodEnd","createdAt","updatedAt") VALUES ($1,$2,$3,'ACTIVE',NOW(),$4,NOW(),NOW()) ON CONFLICT ("tenantId") DO UPDATE SET "planId"=EXCLUDED."planId", "status"='ACTIVE', "currentPeriodEnd"=EXCLUDED."currentPeriodEnd", "updatedAt"=NOW()`, [randomUUID(), actualTenantId, planId, periodEnd]);
  await client.query(`INSERT INTO "ShippingProfile" ("id","tenantId","storeId","name","countryCode","rateMinor","freeAboveMinor","estimatedDays","enabled","createdAt","updatedAt") VALUES ($1,$2,$3,'Pakistan standard','PK',25000,500000,'2–5 business days',TRUE,NOW(),NOW()) ON CONFLICT ("storeId","name") DO NOTHING`, [randomUUID(), actualTenantId, actualStoreId]);
  await client.query(`INSERT INTO "PaymentConnection" ("id","tenantId","storeId","provider","displayName","status","enabled","testMode","createdAt","updatedAt") VALUES ($1,$2,$3,'CASH_ON_DELIVERY','Cash on delivery','CONNECTED',TRUE,FALSE,NOW(),NOW()) ON CONFLICT ("storeId","provider") DO UPDATE SET "status"='CONNECTED', "enabled"=TRUE, "updatedAt"=NOW()`, [randomUUID(), actualTenantId, actualStoreId]);

  const categoryIds = new Map();
  for (const [name, slug] of showcase.categories) {
    const result = await client.query(`INSERT INTO "Category" ("id","tenantId","storeId","name","slug","description","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) ON CONFLICT ("tenantId","storeId","slug") DO UPDATE SET "name"=EXCLUDED."name", "description"=EXCLUDED."description", "updatedAt"=NOW() RETURNING "id"`, [randomUUID(), actualTenantId, actualStoreId, name, slug, `${name}, curated for ${showcase.tenant}.`]);
    categoryIds.set(name, result.rows[0].id);
  }

  for (const [name, slug, category, sku, priceMinor, stock, image, description] of showcase.products) {
    const product = await client.query(`INSERT INTO "Product" ("id","tenantId","storeId","name","slug","description","status","brand","productType","attributes","seoTitle","seoDescription","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$9::jsonb,$10,$6,NOW(),NOW()) ON CONFLICT ("tenantId","storeId","slug") DO UPDATE SET "name"=EXCLUDED."name", "description"=EXCLUDED."description", "status"='ACTIVE', "brand"=EXCLUDED."brand", "productType"=EXCLUDED."productType", "seoTitle"=EXCLUDED."seoTitle", "seoDescription"=EXCLUDED."seoDescription", "updatedAt"=NOW() RETURNING "id"`, [randomUUID(), actualTenantId, actualStoreId, name, slug, description, showcase.tenant, category, JSON.stringify({ featured: true, showcase: true }), `${name} | ${showcase.tenant}`]);
    const productId = product.rows[0].id;
    const variant = await client.query(`INSERT INTO "ProductVariant" ("id","tenantId","productId","sku","title","priceMinor","costMinor","attributes","active","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'Default',$5,$6,$7::jsonb,TRUE,NOW(),NOW()) ON CONFLICT ("tenantId","sku") DO UPDATE SET "productId"=EXCLUDED."productId", "priceMinor"=EXCLUDED."priceMinor", "costMinor"=EXCLUDED."costMinor", "active"=TRUE, "updatedAt"=NOW() RETURNING "id"`, [randomUUID(), actualTenantId, productId, sku, priceMinor, Math.round(priceMinor * .58), JSON.stringify({ colour: "Signature", size: "Standard" })]);
    const variantId = variant.rows[0].id;
    await client.query(`INSERT INTO "InventoryItem" ("id","tenantId","storeId","variantId","locationKey","onHand","reserved","incoming","reorderPoint","updatedAt") VALUES ($1,$2,$3,$4,'main',$5,0,0,5,NOW()) ON CONFLICT ("tenantId","storeId","variantId","locationKey") DO UPDATE SET "onHand"=EXCLUDED."onHand", "reorderPoint"=EXCLUDED."reorderPoint", "updatedAt"=NOW()`, [randomUUID(), actualTenantId, actualStoreId, variantId, stock]);
    const filename = `${slug}.jpg`;
    const media = await client.query(`INSERT INTO "MediaAsset" ("id","tenantId","storeId","filename","originalName","mimeType","sizeBytes","url","altText","createdAt") VALUES ($1,$2,$3,$4,$4,'image/jpeg',0,$5,$6,NOW()) ON CONFLICT ("tenantId","storeId","filename") DO UPDATE SET "url"=EXCLUDED."url", "altText"=EXCLUDED."altText" RETURNING "id"`, [randomUUID(), actualTenantId, actualStoreId, filename, image, `${name} from ${showcase.tenant}`]);
    await client.query(`INSERT INTO "ProductMedia" ("productId","mediaAssetId","sortOrder","isPrimary") VALUES ($1,$2,0,TRUE) ON CONFLICT ("productId","mediaAssetId") DO UPDATE SET "sortOrder"=0, "isPrimary"=TRUE`, [productId, media.rows[0].id]);
    await client.query(`INSERT INTO "ProductCategory" ("tenantId","productId","categoryId") VALUES ($1,$2,$3) ON CONFLICT ("productId","categoryId") DO NOTHING`, [actualTenantId, productId, categoryIds.get(category)]);
  }

  await client.query(`INSERT INTO "AuditLog" ("id","tenantId","storeId","action","entityType","entityId","summary","changes","createdAt") VALUES ($1,$2,$3,'showcase.provisioned','Store',$3,$4,$5::jsonb,NOW())`, [randomUUID(), actualTenantId, actualStoreId, `Provisioned dark showcase store ${showcase.tenant}`, JSON.stringify({ provisionalOwner: true, themeKey: showcase.theme })]);
  return { name: showcase.tenant, slug: showcase.slug, storeId: actualStoreId };
}

const client = await pool.connect();
try {
  await client.query(`ALTER TYPE "StoreVertical" ADD VALUE IF NOT EXISTS 'HARDWARE'`);
  const plan = await client.query(`SELECT "id" FROM "SubscriptionPlan" WHERE "market"='PK' AND "active"=TRUE AND "storeLimit">=1 ORDER BY "monthlyMinor" ASC LIMIT 1`);
  if (!plan.rowCount) throw new Error("No active Pakistan subscription plan is available.");
  await client.query("BEGIN");
  const results = [];
  for (const showcase of showcases) results.push(await provision(client, showcase, plan.rows[0].id));
  await client.query("COMMIT");
  console.log(JSON.stringify({ provisioned: results }, null, 2));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}
