import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse } from 'csv-parse/sync';

const inputFile = process.argv[2];
const outputFile = process.argv[3] ?? '.newsletter/substack-subscribers.sql';
if (!inputFile) {
  console.error('Usage: npm run prepare:subscribers -- /path/to/email_list.csv [output.sql]');
  process.exit(1);
}

const quote = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const rows = parse(readFileSync(inputFile, 'utf8'), { bom: true, columns: true, skip_empty_lines: true });
const eligible = rows.filter((row) => row.email && row.email_disabled !== 'true');
const sql = [];
const emailOctopusCsv = ['Email address,Tags'];

for (const row of eligible) {
  const createdAt = row.created_at || new Date().toISOString();
  sql.push(`INSERT INTO subscribers (email, status, source, created_at, confirmed_at) VALUES (${quote(row.email.trim().toLowerCase())}, 'active', 'substack', ${quote(createdAt)}, ${quote(createdAt)}) ON CONFLICT(email) DO NOTHING;`);
  sql.push(`INSERT OR IGNORE INTO subscriber_topics (subscriber_id, topic) SELECT id, 'life' FROM subscribers WHERE email = ${quote(row.email.trim().toLowerCase())};`);
  emailOctopusCsv.push(`${row.email.trim().toLowerCase()},life`);
}

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, `${sql.join('\n')}\n`, { mode: 0o600 });
const emailOctopusFile = join(dirname(outputFile), 'emailoctopus-contacts.csv');
writeFileSync(emailOctopusFile, `${emailOctopusCsv.join('\n')}\n`, { mode: 0o600 });
console.log(`Prepared ${eligible.length} Just The Right Fit subscribers in ${outputFile} and ${emailOctopusFile}.`);
