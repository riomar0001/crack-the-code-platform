/**
 * Emits a JSON-LD block. `<` is escaped so a value containing `</script>`
 * cannot end the tag early; everything else in the payload is our own data.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
