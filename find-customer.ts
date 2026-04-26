import { db } from './src/lib/db.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const customer = await db.customer.findFirst({
    where: { visits: { some: {} } }
  });
  console.log(customer);
}
main().catch(console.error).finally(() => process.exit(0));
