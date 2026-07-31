# CHANGELOG — Utrip Tržiča

## v1.9.1 — prostorski kontekst, enotno verzioniranje in zaključek prve faze — 31. julij 2026

### Obseg izdaje

- vstopna platforma ostaja **v1.9.1**;
- AI analiza prometa je **v1.62**;
- druge aplikacije ohranjajo vsebinske verzije v1.6, v0.4, v0.1, v0.2 in v0.1;
- formule, uteži, indeks Utrip Tržiča, regresije in scenariji niso bili spremenjeni zaradi prostorskih virov.

### Enotno verzioniranje

- dodan je osrednji register `VERSION.js`;
- dodana je skripta `assets/js/apply-version.js`, ki oznake vstavi v naslove, glave in noge vseh strani;
- odstranjeni sta zastareli navedbi source v1.71 iz dnevnega svetovalca;
- izdelana sta korenski README in README javnega prikaza;
- posodobljeni so vsi obstoječi README-ji in vse datoteke v `docs/`.

### PISO Desktop in občinski prostorski kontekst

Pregledani so bili atributni izvozi PISO Desktop z dne 31. 7. 2026:

- **BCP — osi občinskih cest:** 275 zapisov, 96 cest, 114.651 m v polju `DOLZINA`; 253 JP, 20 LC in 2 LZ;
- **BUS — avtobusna postajališča:** 32 zapisov na 8 cestnih odsekih z atributi lege, širine, čakalnega prostora, pločnika, prehoda, razsvetljave in označb;
- **Pločniki:** 156 zapisov, od tega 154 trenutno veljavnih; 12.880 m v polju `DOLZINA`, mediana širine 1,50 m; zadnja sprememba v izvozu 20. 5. 2026;
- **Omejitve hitrosti:** 52 zapisov, od tega 46 trenutno veljavnih na 18 odsekih; največ evidentiranih odsekov ima omejitev 40 km/h;
- **Naselja ob cestnih odsekih:** 269 zapisov, od tega 261 trenutno veljavnih, 33 šifer naselij;
- **Hitrost, Kolesarske poti in Cestne zapore:** brez podatkovnih vrstic.

XLSX/CSV izvozi ne vsebujejo geometrije. Omogočajo pregled atributov, identifikatorjev in stacionaž, ne pa samostojnega kartiranja. Za prihodnje prostorske preseke so potrebni SHP, GPKG ali GeoJSON, koordinatni sistem in šifranti kod.

### Zaključek prve razvojne faze

- določen je uradni presek **31. 7. 2026**;
- obseg aplikacij je za prvo objavo zamrznjen;
- PISO ostaja kontekstni vir brez velikih kartografskih prikazov;
- naslednje izboljšave so usmerjene v osveževanje podatkov, odzive uporabnikov, validacijo modelov, interaktivne »what-if« scenarije in boljšo sledljivost, ne v hitro dodajanje novih aplikacij.

### Dokumentacija

- TEMELJI PLATFORME: v1.5;
- CHANGELOG: v1.5;
- PODATKOVNI KATALOG: v1.1.

## v1.9 — Tržič v turističnem okolju v0.2 in revizija dogodkov — 30. julij 2026

- primerjava Tržiča z Radovljico, Bledom, Preddvorom, Jesenicami in Idrijo;
- mesečni niz januar 2020–junij 2026 ter letni niz 2018–2025;
- modelna potrošnja tujih turistov za leto 2025;
- 3.547 dnevnih zapisov dogodkov za obdobje 1. 11. 2023–10. 8. 2026;
- Dogodki pomenijo aktivne koledarske dneve, ne obiskanosti ali dokazanega prometnega vpliva.

## v1.8 — Uresničevanje Strategije turizma in Turistični utrip v0.4 — 25. julij 2026

- dodana aplikacija Uresničevanje Strategije turizma 2024–2031 v0.1;
- Turistični utrip posodobljen na v0.4 in povezan z agregiranim GA4 izvozom;
- strategija je cilj, turistično poročanje je dejansko stanje, OPN pa prostorski kontekst.

## v1.6–v1.7 — prometni podatki, javni prikaz in deževni vrt — julij 2026

- dnevni CABLEX podatki, smeri, vrste vozil, hitrosti in označena interpolacija 20. 5.–22. 8. 2024;
- sedem parkirišč, EasyPark, HECTRONIC, dogodki, vreme, turizem, prekrški in EV polnilnica;
- relativni indeks Utrip Tržiča;
- javni Prometni utrip v1.6;
- Deževni vrt OŠ Bistrica v0.1.
