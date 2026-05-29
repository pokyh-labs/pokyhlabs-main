import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { feature } from 'topojson-client';
import topology from 'world-atlas/countries-110m.json';

const geoFeatures = feature(topology, topology.objects.countries);

// ISO 3166-1 numeric → alpha-2
const NUM_TO_A2 = {
  4:'AF',8:'AL',12:'DZ',20:'AD',24:'AO',28:'AG',31:'AZ',32:'AR',36:'AU',40:'AT',
  44:'BS',48:'BH',50:'BD',51:'AM',52:'BB',56:'BE',64:'BT',68:'BO',70:'BA',72:'BW',
  76:'BR',84:'BZ',90:'SB',96:'BN',100:'BG',104:'MM',108:'BI',112:'BY',116:'KH',
  120:'CM',124:'CA',132:'CV',140:'CF',144:'LK',148:'TD',152:'CL',156:'CN',170:'CO',
  174:'KM',178:'CG',180:'CD',188:'CR',191:'HR',192:'CU',196:'CY',203:'CZ',204:'BJ',
  208:'DK',212:'DM',214:'DO',218:'EC',222:'SV',226:'GQ',231:'ET',232:'ER',233:'EE',
  242:'FJ',246:'FI',250:'FR',262:'DJ',266:'GA',268:'GE',270:'GM',276:'DE',288:'GH',
  296:'KI',300:'GR',308:'GD',320:'GT',324:'GN',328:'GY',332:'HT',340:'HN',348:'HU',
  352:'IS',356:'IN',360:'ID',364:'IR',368:'IQ',372:'IE',376:'IL',380:'IT',384:'CI',
  388:'JM',392:'JP',398:'KZ',400:'JO',404:'KE',408:'KP',410:'KR',414:'KW',417:'KG',
  418:'LA',422:'LB',426:'LS',428:'LV',430:'LR',434:'LY',438:'LI',440:'LT',442:'LU',
  450:'MG',454:'MW',458:'MY',462:'MV',466:'ML',470:'MT',478:'MR',480:'MU',484:'MX',
  492:'MC',496:'MN',498:'MD',499:'ME',504:'MA',508:'MZ',516:'NA',520:'NR',524:'NP',
  528:'NL',548:'VU',554:'NZ',558:'NI',562:'NE',566:'NG',578:'NO',583:'FM',584:'MH',
  585:'PW',586:'PK',591:'PA',598:'PG',600:'PY',604:'PE',608:'PH',616:'PL',620:'PT',
  624:'GW',626:'TL',634:'QA',642:'RO',643:'RU',646:'RW',659:'KN',662:'LC',670:'VC',
  678:'ST',682:'SA',686:'SN',688:'RS',690:'SC',694:'SL',702:'SG',703:'SK',704:'VN',
  705:'SI',706:'SO',710:'ZA',716:'ZW',724:'ES',728:'SS',729:'SD',740:'SR',752:'SE',
  756:'CH',760:'SY',762:'TJ',764:'TH',768:'TG',776:'TO',780:'TT',784:'AE',788:'TN',
  792:'TR',795:'TM',800:'UG',804:'UA',807:'MK',818:'EG',826:'GB',834:'TZ',840:'US',
  854:'BF',858:'UY',860:'UZ',862:'VE',882:'WS',887:'YE',894:'ZM',
};

// ISO alpha-2 → display name
const A2_NAME = {
  AF:'Afghanistan',AL:'Albanien',DZ:'Algerien',AD:'Andorra',AO:'Angola',AG:'Antigua',
  AZ:'Aserbaidschan',AR:'Argentinien',AU:'Australien',AT:'Österreich',BS:'Bahamas',
  BH:'Bahrain',BD:'Bangladesch',AM:'Armenien',BB:'Barbados',BE:'Belgien',BT:'Bhutan',
  BO:'Bolivien',BA:'Bosnien',BW:'Botswana',BR:'Brasilien',BZ:'Belize',SB:'Salomonen',
  BN:'Brunei',BG:'Bulgarien',MM:'Myanmar',BI:'Burundi',BY:'Belarus',KH:'Kambodscha',
  CM:'Kamerun',CA:'Kanada',CV:'Kap Verde',CF:'Zentralafrika',LK:'Sri Lanka',TD:'Tschad',
  CL:'Chile',CN:'China',CO:'Kolumbien',KM:'Komoren',CG:'Kongo',CD:'DR Kongo',
  CR:'Costa Rica',HR:'Kroatien',CU:'Kuba',CY:'Zypern',CZ:'Tschechien',BJ:'Benin',
  DK:'Dänemark',DM:'Dominica',DO:'Dominikanische Rep.',EC:'Ecuador',SV:'El Salvador',
  GQ:'Äquatorialguinea',ET:'Äthiopien',ER:'Eritrea',EE:'Estland',FJ:'Fidschi',
  FI:'Finnland',FR:'Frankreich',DJ:'Dschibuti',GA:'Gabun',GE:'Georgien',GM:'Gambia',
  DE:'Deutschland',GH:'Ghana',KI:'Kiribati',GR:'Griechenland',GD:'Grenada',
  GT:'Guatemala',GN:'Guinea',GY:'Guyana',HT:'Haiti',HN:'Honduras',HU:'Ungarn',
  IS:'Island',IN:'Indien',ID:'Indonesien',IR:'Iran',IQ:'Irak',IE:'Irland',
  IL:'Israel',IT:'Italien',CI:'Elfenbeinküste',JM:'Jamaika',JP:'Japan',KZ:'Kasachstan',
  JO:'Jordanien',KE:'Kenia',KP:'Nordkorea',KR:'Südkorea',KW:'Kuwait',KG:'Kirgisistan',
  LA:'Laos',LB:'Libanon',LS:'Lesotho',LV:'Lettland',LR:'Liberia',LY:'Libyen',
  LI:'Liechtenstein',LT:'Litauen',LU:'Luxemburg',MG:'Madagaskar',MW:'Malawi',
  MY:'Malaysia',MV:'Malediven',ML:'Mali',MT:'Malta',MR:'Mauretanien',MU:'Mauritius',
  MX:'Mexiko',MC:'Monaco',MN:'Mongolei',MD:'Moldau',ME:'Montenegro',MA:'Marokko',
  MZ:'Mosambik',NA:'Namibia',NR:'Nauru',NP:'Nepal',NL:'Niederlande',VU:'Vanuatu',
  NZ:'Neuseeland',NI:'Nicaragua',NE:'Niger',NG:'Nigeria',NO:'Norwegen',FM:'Mikronesien',
  MH:'Marshallinseln',PW:'Palau',PK:'Pakistan',PA:'Panama',PG:'Papua-Neuguinea',
  PY:'Paraguay',PE:'Peru',PH:'Philippinen',PL:'Polen',PT:'Portugal',GW:'Guinea-Bissau',
  TL:'Timor-Leste',QA:'Katar',RO:'Rumänien',RU:'Russland',RW:'Ruanda',KN:'St. Kitts',
  LC:'St. Lucia',VC:'St. Vincent',ST:'São Tomé',SA:'Saudi-Arabien',SN:'Senegal',
  RS:'Serbien',SC:'Seychellen',SL:'Sierra Leone',SG:'Singapur',SK:'Slowakei',
  VN:'Vietnam',SI:'Slowenien',SO:'Somalia',ZA:'Südafrika',ZW:'Simbabwe',ES:'Spanien',
  SS:'Südsudan',SD:'Sudan',SR:'Surinam',SE:'Schweden',CH:'Schweiz',SY:'Syrien',
  TJ:'Tadschikistan',TH:'Thailand',TG:'Togo',TO:'Tonga',TT:'Trinidad',AE:'Vereinigte Arab. Emirate',
  TN:'Tunesien',TR:'Türkei',TM:'Turkmenistan',UG:'Uganda',UA:'Ukraine',MK:'Nordmazedonien',
  EG:'Ägypten',GB:'Vereinigtes Königreich',TZ:'Tansania',US:'USA',BF:'Burkina Faso',
  UY:'Uruguay',UZ:'Usbekistan',VE:'Venezuela',WS:'Samoa',YE:'Jemen',ZM:'Sambia',
};

function countryColor(ratio) {
  if (ratio <= 0) return 'rgba(255,255,255,0.05)';
  const a = 0.15 + ratio * 0.82;
  return `rgba(89,61,248,${a.toFixed(3)})`;
}

function countryHoverColor(ratio) {
  if (ratio <= 0) return 'rgba(255,255,255,0.10)';
  return 'rgba(124,92,248,1)';
}

export default function WorldMap({ countries = [], className = '' }) {
  const [hovered, setHovered] = useState(null);

  const { countByCode, maxCount } = useMemo(() => {
    const map = {};
    let max = 0;
    for (const c of countries) {
      if (c.country_code) {
        const n = parseInt(c.count) || 0;
        map[c.country_code] = { count: n, name: c.country || A2_NAME[c.country_code] || c.country_code };
        if (n > max) max = n;
      }
    }
    return { countByCode: map, maxCount: max || 1 };
  }, [countries]);

  return (
    <div className={className} style={{
      position: 'relative',
      background: 'linear-gradient(160deg, #0a0a16 0%, #06060f 100%)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 130, center: [10, 20] }}
        height={380}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <Geographies geography={geoFeatures}>
          {({ geographies }) =>
            geographies.map(geo => {
              const a2 = NUM_TO_A2[parseInt(geo.id)];
              const info = countByCode[a2];
              const cnt = info?.count || 0;
              const ratio = cnt > 0 ? Math.log(cnt + 1) / Math.log(maxCount + 1) : 0;
              const isHov = hovered === a2;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHov ? countryHoverColor(ratio) : countryColor(ratio)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={0.35}
                  onMouseEnter={() => a2 && setHovered(a2)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    default: { outline: 'none', transition: 'fill 120ms' },
                    hover:   { outline: 'none', cursor: 'default' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Hover tooltip — bottom-left corner */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14,
        background: 'rgba(12,12,12,0.92)',
        border: `1px solid ${hovered && countByCode[hovered] ? 'rgba(89,61,248,0.5)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 9, padding: '9px 14px',
        minWidth: 140, transition: 'border-color 150ms',
      }}>
        {hovered ? (
          <>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
              {A2_NAME[hovered] || hovered}
            </div>
            <div style={{ fontSize: '0.73rem', color: countByCode[hovered] ? 'rgba(89,61,248,0.9)' : 'rgba(255,255,255,0.3)', marginTop: 3 }}>
              {countByCode[hovered]
                ? `${countByCode[hovered].count.toLocaleString()} Anfragen`
                : 'Keine Daten'}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.25)' }}>Land hovern…</div>
        )}
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Wenig</span>
        <div style={{
          width: 80, height: 6, borderRadius: 99,
          background: 'linear-gradient(to right, rgba(89,61,248,0.12), rgba(89,61,248,1))',
        }} />
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Viel</span>
      </div>

      <style>{`
        .rsm-geography { transition: fill 120ms ease; }
      `}</style>
    </div>
  );
}
