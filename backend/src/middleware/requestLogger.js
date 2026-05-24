const geoip = require('geoip-lite');
const { AccessLog } = require('../models');
const logger = require('../utils/logger');

// Normalize IPv4-mapped IPv6 addresses (::ffff:1.2.3.4 → 1.2.3.4)
function normalizeIp(ip) {
  if (!ip) return null;
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function isPrivateIp(ip) {
  if (!ip) return true;
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

module.exports = function requestLogger(req, res, next) {
  // Only log API requests
  if (!req.originalUrl.startsWith('/api/')) return next();

  const start = Date.now();

  res.on('finish', () => {
    try {
      const rawIp = req.ip || req.socket?.remoteAddress || '';
      const ip = normalizeIp(rawIp);

      let geo = null;
      if (ip && !isPrivateIp(ip)) {
        geo = geoip.lookup(ip);
      }

      AccessLog.create({
        method:        req.method,
        url:           req.originalUrl.slice(0, 1000),
        status:        res.statusCode,
        response_time: Date.now() - start,
        ip:            (ip || rawIp).slice(0, 45),
        user_agent:    (req.headers['user-agent'] || '').slice(0, 500),
        user_id:       req.user?.id   || null,
        username:      req.user?.username || null,
        country_code:  geo?.country  || null,
        country:       geo?.country  ? getCountryName(geo.country) : null,
        city:          geo?.city     || null,
        lat:           geo?.ll?.[0]  ?? null,
        lng:           geo?.ll?.[1]  ?? null,
      }).catch(err => logger.debug('AccessLog write failed', { msg: err.message }));
    } catch (err) {
      logger.debug('requestLogger error', { msg: err.message });
    }
  });

  next();
};

// Compact ISO 3166-1 alpha-2 → display name map
const NAMES = {
  AD:'Andorra',AE:'Vereinigte Arab. Emirate',AF:'Afghanistan',AG:'Antigua und Barbuda',
  AL:'Albanien',AM:'Armenien',AO:'Angola',AR:'Argentinien',AT:'Österreich',AU:'Australien',
  AZ:'Aserbaidschan',BA:'Bosnien und Herzegowina',BB:'Barbados',BD:'Bangladesch',
  BE:'Belgien',BF:'Burkina Faso',BG:'Bulgarien',BH:'Bahrain',BI:'Burundi',
  BJ:'Benin',BN:'Brunei',BO:'Bolivien',BR:'Brasilien',BS:'Bahamas',BT:'Bhutan',
  BW:'Botswana',BY:'Belarus',BZ:'Belize',CA:'Kanada',CD:'DR Kongo',
  CF:'Zentralafrik. Republik',CG:'Kongo',CH:'Schweiz',CI:'Elfenbeinküste',
  CL:'Chile',CM:'Kamerun',CN:'China',CO:'Kolumbien',CR:'Costa Rica',
  CU:'Kuba',CV:'Kap Verde',CY:'Zypern',CZ:'Tschechien',DE:'Deutschland',
  DJ:'Dschibuti',DK:'Dänemark',DM:'Dominica',DO:'Dominikanische Republik',
  DZ:'Algerien',EC:'Ecuador',EE:'Estland',EG:'Ägypten',ER:'Eritrea',
  ES:'Spanien',ET:'Äthiopien',FI:'Finnland',FJ:'Fidschi',FM:'Mikronesien',
  FR:'Frankreich',GA:'Gabun',GB:'Vereinigtes Königreich',GD:'Grenada',
  GE:'Georgien',GH:'Ghana',GM:'Gambia',GN:'Guinea',GQ:'Äquatorialguinea',
  GR:'Griechenland',GT:'Guatemala',GW:'Guinea-Bissau',GY:'Guyana',
  HN:'Honduras',HR:'Kroatien',HT:'Haiti',HU:'Ungarn',ID:'Indonesien',
  IE:'Irland',IL:'Israel',IN:'Indien',IQ:'Irak',IR:'Iran',IS:'Island',
  IT:'Italien',JM:'Jamaika',JO:'Jordanien',JP:'Japan',KE:'Kenia',
  KG:'Kirgisistan',KH:'Kambodscha',KI:'Kiribati',KM:'Komoren',
  KN:'St. Kitts und Nevis',KP:'Nordkorea',KR:'Südkorea',KW:'Kuwait',
  KZ:'Kasachstan',LA:'Laos',LB:'Libanon',LC:'St. Lucia',LI:'Liechtenstein',
  LK:'Sri Lanka',LR:'Liberia',LS:'Lesotho',LT:'Litauen',LU:'Luxemburg',
  LV:'Lettland',LY:'Libyen',MA:'Marokko',MC:'Monaco',MD:'Moldau',
  ME:'Montenegro',MG:'Madagaskar',MH:'Marshallinseln',MK:'Nordmazedonien',
  ML:'Mali',MM:'Myanmar',MN:'Mongolei',MR:'Mauretanien',MT:'Malta',
  MU:'Mauritius',MV:'Malediven',MW:'Malawi',MX:'Mexiko',MY:'Malaysia',
  MZ:'Mosambik',NA:'Namibia',NE:'Niger',NG:'Nigeria',NI:'Nicaragua',
  NL:'Niederlande',NO:'Norwegen',NP:'Nepal',NR:'Nauru',NZ:'Neuseeland',
  OM:'Oman',PA:'Panama',PE:'Peru',PG:'Papua-Neuguinea',PH:'Philippinen',
  PK:'Pakistan',PL:'Polen',PT:'Portugal',PW:'Palau',PY:'Paraguay',
  QA:'Katar',RO:'Rumänien',RS:'Serbien',RU:'Russland',RW:'Ruanda',
  SA:'Saudi-Arabien',SB:'Salomonen',SC:'Seychellen',SD:'Sudan',
  SE:'Schweden',SG:'Singapur',SI:'Slowenien',SK:'Slowakei',
  SL:'Sierra Leone',SM:'San Marino',SN:'Senegal',SO:'Somalia',
  SR:'Surinam',SS:'Südsudan',ST:'São Tomé und Príncipe',SV:'El Salvador',
  SY:'Syrien',SZ:'Eswatini',TD:'Tschad',TG:'Togo',TH:'Thailand',
  TJ:'Tadschikistan',TL:'Osttimor',TM:'Turkmenistan',TN:'Tunesien',
  TO:'Tonga',TR:'Türkei',TT:'Trinidad und Tobago',TV:'Tuvalu',
  TZ:'Tansania',UA:'Ukraine',UG:'Uganda',US:'USA',UY:'Uruguay',
  UZ:'Usbekistan',VA:'Vatikanstadt',VC:'St. Vincent und die Grenadinen',
  VE:'Venezuela',VN:'Vietnam',VU:'Vanuatu',WS:'Samoa',YE:'Jemen',
  ZA:'Südafrika',ZM:'Sambia',ZW:'Simbabwe',
};

function getCountryName(code) {
  return NAMES[code] || code;
}
