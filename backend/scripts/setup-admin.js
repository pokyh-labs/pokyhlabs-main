const path = require('path');
const fs = require('fs');
const readline = require('readline');
const dotenv = require('dotenv');

const rootEnv = path.resolve(__dirname, '../../.env');
const localEnv = path.resolve(__dirname, '../.env');
dotenv.config({ path: fs.existsSync(rootEnv) ? rootEnv : localEnv });

const { sequelize, User } = require('../src/models');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultValue) {
  return new Promise((resolve) => {
    const display = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(display, (answer) => resolve(answer.trim() || defaultValue || ''));
  });
}

function c(code, text) { return `\x1b[${code}m${text}\x1b[0m`; }

async function main() {
  console.log(`\n${c('1;34', 'Admin User erstellen')}\n`);

  await sequelize.authenticate();
  await sequelize.sync({ alter: false });

  // Username
  let username;
  while (true) {
    username = await ask('Username');
    if (!username) { console.log(`  ${c(33, 'Warnung')}  Username darf nicht leer sein.`); continue; }
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(username)) {
      console.log(`  ${c(33, 'Warnung')}  Nur Buchstaben, Zahlen, _ und - (3-50 Zeichen).`); continue;
    }
    const exists = await User.findOne({ where: { username } });
    if (exists) { console.log(`  ${c(33, 'Warnung')}  Username "${username}" ist bereits vergeben.`); continue; }
    break;
  }

  // E-Mail
  let email;
  while (true) {
    email = await ask('E-Mail');
    if (!email) { console.log(`  ${c(33, 'Warnung')}  E-Mail darf nicht leer sein.`); continue; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log(`  ${c(33, 'Warnung')}  Ungueltige E-Mail-Adresse.`); continue;
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) { console.log(`  ${c(33, 'Warnung')}  E-Mail "${email}" wird bereits verwendet.`); continue; }
    break;
  }

  // Passwort (plain text — development tool, run locally)
  let password;
  while (true) {
    password = await ask('Passwort (mind. 8 Zeichen, sichtbar)');
    if (password.length < 8) {
      console.log(`  ${c(33, 'Warnung')}  Mindestens 8 Zeichen erforderlich.`); continue;
    }
    const confirm = await ask('Passwort bestaetigen');
    if (password !== confirm) {
      console.log(`  ${c(33, 'Warnung')}  Passwoerter stimmen nicht ueberein.`); continue;
    }
    break;
  }

  // Rolle
  let role;
  while (true) {
    const r = await ask('Rolle (admin/editor)', 'admin');
    if (r === 'admin' || r === 'editor') { role = r; break; }
    console.log(`  ${c(33, 'Warnung')}  Bitte "admin" oder "editor" eingeben.`);
  }

  // Bestaetigung
  console.log(`\n  Username : ${c(36, username)}`);
  console.log(`  E-Mail   : ${c(36, email)}`);
  console.log(`  Rolle    : ${c(36, role)}`);
  const ok = await ask('\nUser erstellen? (ja/nein)', 'ja');

  rl.close();

  if (ok !== 'ja') { console.log('\nAbgebrochen.\n'); process.exit(0); }

  await User.create({ username, email, password_hash: password, role });
  console.log(`\n${c('1;32', `User "${username}" (${role}) erfolgreich erstellt!`)}\n`);
  process.exit(0);
}

main().catch((err) => {
  rl.close();
  console.error(`\n${c(31, `Fehler: ${err.message}`)}\n`);
  process.exit(1);
});
