// 一次性迁移脚本：把 bhwa233-api 线上自定义命令导出为
// SparkHub D1 (custom_commands 表) 可执行的 SQL 文件。
//
// 源：线上 bapi 管理接口 https://bapi.bhwa233.com/api/command/config
//     （key 走 x-command-key 头）——这是生产真数据。
//     注意：不要用本地 .env 的 DATABASE_URL，那是另一个 stale/dev Neon 库。
//
// 用法：
//   COMMAND_KEY=bhwa233 node scripts/migrate-custom-commands-to-d1.mjs
// 产出：scripts/custom-commands.d1.sql
// 再到 SparkHub 应用：
//   cd ../SparkHub/apps/api
//   pnpm wrangler d1 execute linkdisk-db --remote \
//     --file=../../../bhwa233-api/scripts/custom-commands.d1.sql
//
// 冲突策略：INSERT OR IGNORE（command 唯一）——跳过 D1 中已存在的行。
// imageUrl 多为内联 data:image base64，自包含、与 host 无关，原样保留。

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, 'custom-commands.d1.sql');

const SOURCE_URL =
  process.env.SOURCE_URL || 'https://bapi.bhwa233.com/api/command/config';
const COMMAND_KEY = process.env.COMMAND_KEY || 'bhwa233';

// D1 表列顺序（见 SparkHub migrations/0019_command_tables.sql）
const COLUMNS = [
  'id',
  'ownerKeyHash',
  'name',
  'command',
  'description',
  'replyType',
  'contentText',
  'imageUrl',
  'status',
  'reviewerKeyHash',
  'reviewComment',
  'submittedAt',
  'reviewedAt',
  'enabled',
  'sortOrder',
  'createTime',
  'updateTime',
];

const DATE_COLUMNS = new Set(['submittedAt', 'reviewedAt', 'createTime', 'updateTime']);
const BOOL_COLUMNS = new Set(['enabled']);
const INT_COLUMNS = new Set(['sortOrder']);

function sqlLiteral(column, value) {
  if (value === null || value === undefined) return 'NULL';
  if (BOOL_COLUMNS.has(column)) return value ? '1' : '0';
  if (INT_COLUMNS.has(column)) return String(Math.trunc(Number(value)));
  if (DATE_COLUMNS.has(column)) {
    const iso = value instanceof Date ? value.toISOString() : new Date(value).toISOString();
    return `'${iso}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  const res = await fetch(SOURCE_URL, { headers: { 'x-command-key': COMMAND_KEY } });
  if (!res.ok) throw new Error(`拉取源失败: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('源返回非数组: ' + JSON.stringify(rows).slice(0, 200));

  const colList = COLUMNS.join(', ');
  // 不输出 BEGIN/COMMIT —— wrangler d1 execute 自身已包事务，且 D1 禁止 SQL 层显式事务。
  const lines = [
    '-- 自动生成：bhwa233 线上 CustomCommand -> SparkHub D1 custom_commands',
    `-- 源: ${SOURCE_URL}`,
    `-- 源行数: ${rows.length}`,
  ];

  for (const row of rows) {
    const values = COLUMNS.map((col) => sqlLiteral(col, row[col])).join(', ');
    lines.push(`INSERT OR IGNORE INTO custom_commands (${colList}) VALUES (${values});`);
  }
  lines.push('');
  writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');

  console.log(`源行数: ${rows.length}`);
  console.log('命令: ' + rows.map((r) => r.command).join(', '));
  console.log(`已写出 SQL: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('迁移脚本失败:', err);
  process.exit(1);
});
