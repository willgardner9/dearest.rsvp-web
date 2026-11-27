// Makes a URL slug from a wedding name, for example "Alex & Sam" gives "alex-and-sam".
// The API does not store a slug yet. Later the couple chooses one in the website setup,
// and the app shows that slug instead of this one.
export function weddingSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
