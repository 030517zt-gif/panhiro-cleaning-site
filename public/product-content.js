import { DEFAULT_PRODUCTS } from "./content-seed.js";

const importedBySlug = new Map(DEFAULT_PRODUCTS.map((product) => [String(product.slug), product]));

// D1 rows predate the complete source import and do not have rich fields
// such as gallery, detail_html or source_url. Keep the API row metadata while
// filling those imported catalog fields from the matching local source record.
export function enrichProductRecords(products) {
  return (products || []).map((product) => {
    const imported = importedBySlug.get(String(product.slug));
    if (!imported) return product;
    return {
      ...product,
      name: imported.name,
      category: imported.category,
      tagline: imported.tagline,
      description: imported.description,
      image_url: imported.image_url,
      specs: imported.specs,
      gallery: imported.gallery,
      detail_html: imported.detail_html,
      source_url: imported.source_url,
      source_title: imported.source_title,
      source_brand: imported.source_brand,
      brand: imported.brand
    };
  });
}
