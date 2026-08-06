# CHANGELOG — Utrip Tržiča

## v2.0.1 — Prometni odseki Tržiča v0.2: aktiviran odsek Zvirče — 5. avgust 2026

### Obseg

- v aplikaciji `apps/prometni-odseki/` je aktiviran drugi odsek **Zvirče**;
- spustni seznam sedaj zamenja celotno stran med odsekoma Križe / Retnje in Zvirče;
- korenski `index.html` ter druge aplikacije niso spremenjeni;
- vstopna platforma ostaja v2.0, source package je v2.0.1, Prometni odseki pa v0.2.

### Podatki in smeri Zvirče

- Elastic/Kibana obsega 12-urne intervale od 3. 8. 2023 do 5. 8. 2026;
- primerljivo obdobje vsebuje 1.094 popolnih dni od 4. 8. 2023 do 4. 8. 2026;
- potrjeno je `direction 1 = Zvirče → Kranj` in `direction 0 = Zvirče → Tržič`;
- oznaki direction v imenih dveh hitrostnih CSV-jev sta vsebinsko zamenjani; pravilna preslikava temelji na 100-odstotnem ujemanju vseh 2.194 skupnih intervalov in neposrednih kontrolnih izvozih TC25;
- izločeni so nepopolna začetni in končni dan ter 11. 10. 2023, 5. 1. 2026 in 26. 7. 2026 zaradi manjkajoče polovice dneva.

### Funkcionalnost in metodologija

- dodana je podatkovna datoteka `data-js/zvirce.js` in nespremenjeni izvorni izvozi v ločenih podmapah;
- celotna stran dinamično osveži naslove, smeri, obdobja, KPI-je, grafa, tabelo, povzetek, kontekst, metodologijo in vire;
- upoštevane so kategorije osebnih, kombiniranih, težjih tovornih, tovornih s prikolico in drugih evidentiranih vozil;
- zaradi napačnega izvornega stolpca »100 ali več« je za Zvirče prikazana samo spodnja meja dokazano evidentiranih vozil ≥100 km/h; graf združi vse meritve nad 90 km/h;
- prometnovarnostni kontekst vključuje stanovanjsko naselje, pešce in pločnike, priključke ter avtobusni postajališči; v neposrednem kontekstu ni osnovne šole;
- podatki o nesrečah niso vključeni in radar ni avtomatski sklep.

### Dokumentacija

- Tehnična dokumentacija je posodobljena na v2.1;
- CHANGELOG na v1.7;
- PODATKOVNI KATALOG na v1.3;
- TEMELJI PLATFORME v1.5 ostajajo nespremenjeni.

## v2.0 — začetek 2. razvojne faze in Prometni odseki Tržiča v0.1 — 5. avgust 2026

### Nova aplikacija

- dodana je samostojna mapa `apps/prometni-odseki/`;
- prva analiza je **Odsek Križe / Retnje**; Zvirče je v registru označeno kot naslednji načrtovani odsek;
- na vstopno stran je dodana sedma aktivna kartica;
- vstopna platforma in source package sta označena kot v2.0 oziroma začetek 2. razvojne faze;
- obstoječih šest aplikacij, njihovi izračuni, podatki in postavitve niso bili vsebinsko spremenjeni.

### Podatki Križe / Retnje

- Elastic/Kibana obdobje 11. 7. 2024 00:00–4. 8. 2026 12:00;
- izvoz z nazivom »Urni profil« ima dejansko 12-urno ločljivost;
- primerljivo obdobje vsebuje 751 popolnih dni med 12. 7. 2024 in 3. 8. 2026;
- izločena sta nepopoln začetni in nepopoln končni dan ter 5. 1. 2026 in 26. 7. 2026 zaradi manjkajoče polovice dneva;
- vključene so kategorije osebnih, enoslednih, kombiniranih, težjih tovornih, tovornih s prikolico in nerazpoznanih vozil.

### Validacija in normalizacija

- potrjeno je `direction 1 = Retnje → Križe` in `direction 0 = Križe → Retnje`;
- vsebini dveh hitrostnih CSV-jev sta bili glede na imeni zamenjani;
- pravilna pripadnost je potrjena s 100-odstotnim ujemanjem števila vozil v vseh 1.510 intervalih in z neposrednim izvozom TC25;
- izvorne datoteke ostajajo nespremenjene, popravek je izveden samo v normalizirani datoteki;
- nepravilen stolpec »100 ali več« ni uporabljen kot število; tri meritve ≥100 km/h so rekonstruirane po dokumentiranem pravilu.

### Funkcionalnost in metodologija

- izbira odseka, obdobja in smeri;
- KPI-ji za obseg, povprečje na dan, prometno uteženo povprečno hitrost, intervalno oceno P85, največjo hitrost in prekoračitve;
- dva lokalna SVG-grafa: hitrostni razredi ter 12-urni profil po smereh oziroma vrstah vozil;
- podrobna tabela prekoračitev s številom, deležem in povprečjem na dan;
- opisni povzetek temelji na meritvah in lokacijskem kontekstu, vendar ne predstavlja avtomatske odločitve o radarju;
- prometne nesreče niso vključene in ostajajo odprt podatkovni vir.

### Dokumentacija

- dodana je `docs/TEHNICNA_DOKUMENTACIJA.md` in formalna tehnična dokumentacija v2.0;
- CHANGELOG je posodobljen na v1.6;
- PODATKOVNI KATALOG je posodobljen na v1.2;
- TEMELJI PLATFORME v1.5 so vključeni nespremenjeni;
- `VERSION.js`, korenski README, metodologija in podatkovni viri so usklajeni z izdajo.

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
