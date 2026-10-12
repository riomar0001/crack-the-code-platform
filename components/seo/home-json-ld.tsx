import { connection } from "next/server";

import { JsonLd } from "@/components/seo/json-ld";
import { isRegistrationOpen } from "@/lib/registration/window";
import { homeJsonLd } from "@/lib/seo";

/**
 * The home page's structured data. `connection()` keeps it out of the
 * prerender, so the offer's availability reflects the clock at request time:
 * open until registration closes, sold out after.
 */
export async function HomeJsonLd() {
  await connection();

  return <JsonLd data={homeJsonLd({ registrationOpen: isRegistrationOpen() })} />;
}
