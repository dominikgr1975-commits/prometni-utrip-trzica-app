# Podatkovni viri — Utrip Tržiča

**Presek dokumentacije:** 5. 8. 2026 · source package v2.0.1. Podrobni vnosi so tudi v `docs/PODATKOVNI_KATALOG.md` in v README-jih posameznih aplikacij.

## Promet, parkiranje in mobilnost

- **CABLEX promet, smeri, vrste vozil in hitrosti:** Elastic/Kibana; 3. 8. 2023–23. 7. 2026; ena merilna lokacija.
- **Zasedenost parkirišč:** sedem spremljanih parkirišč; različna dolžina zgodovine.
- **EasyPark in HECTRONIC:** transakcije, prihodki in kategorije; sistema imata različno strukturo in se ne smeta dvojno šteti.
- **Prekrški:** občinski Elasticsearch/Kibana; 7/2019–7/2026; rezultat je odvisen tudi od obsega nadzora.
- **EV polnilnica Tržnica:** ena lokacija; ni reprezentativna za celotno e-mobilnost.
- **Dogodki:** 3.547 dnevnih zapisov, 1. 11. 2023–10. 8. 2026; večdnevni dogodki so razširjeni na aktivne dni.
- **Prazniki:** OPSI; ločiti praznik od dela prostega dne.
- **Vreme:** Open-Meteo; modelna/reanalizirana točka pri CABLEX.
- **SURS delovno aktivni in prebivalci:** uporabljeni samo v definiranem prostorskem obsegu.

## Občinski prostorski in mobilnostni kontekst

### Interni evidenci

- `Naselja-po-KSjih-PP-2024.csv`: 13 krajevnih skupnosti, 35 naselij in 2.881 unikatnih naslovnih točk; v javnem paketu so samo agregati.
- `Evidenca opremljenosti postajališč_201801.xlsx`: 30 lokacij in 57 smeri; zgodovinski presek 15. 1. 2018 brez koordinat.

### PISO Desktop — atributni izvozi 31. 7. 2026

| Izvoz | Ugotovljena vsebina | Dovoljena uporaba | Glavna omejitev |
|---|---|---|---|
| `bcp.xlsx` | 275 zapisov osi občinskih cest, 96 cest, 114.651 m; 253 JP, 20 LC, 2 LZ | osnovni linearni referenčni kontekst | brez geometrije; potreben šifrant kategorij |
| `bus.xlsx` | 32 zapisov na 8 odsekih; lega, širina, čakalni prostor, pločnik, prehod, razsvetljava in označbe | dopolnilni kontekst postajališč | brez imen in koordinat; kode niso razložene |
| `plocnik.xlsx` / `plocnik.csv` | 156 zapisov, 154 trenutno veljavnih, 12.880 m; mediana širine 1,50 m | prihodnja analiza peš dostopnosti in varnosti | atributi brez geometrije; pokritost ni dokazano popolna |
| `omejitevhitrost.xlsx` | 52 zapisov, 46 trenutno veljavnih na 18 odsekih; omejitve 20/30/40/70 | kontekst za CABLEX in prometne razlage | ne pokriva nujno celotnega omrežja; del zapisov je zgodovinski |
| `naselja.xlsx` | 269 zapisov, 261 trenutno veljavnih, 33 šifer naselij | povezava cestnih stacionaž z naselbinskim kontekstom | ni seznam vseh 35 naselij in ne vsebuje poligonov |
| `hitrost.xlsx` | samo glava, brez podatkovnih vrstic | ni uporabljeno | manjkajoč vir, ne vrednost nič |
| `kolesarske.xlsx` | samo glava, brez podatkovnih vrstic | ni uporabljeno | manjkajoč vir, ne dokaz odsotnosti poti |
| `cestne zopore(1).xlsx` | samo glava, brez podatkovnih vrstic | ni uporabljeno | ni zgodovine zapor |

Izvorni PISO izvozi niso vključeni v javni source package. V prvi fazi so dokumentirani kot kontekst. Za kartiranje in prostorske preseke so potrebni SHP, GPKG ali GeoJSON, koordinatni sistem in šifranti.

## Turizem

- **Turistično poročanje:** gostje, nočitve, turistična taksa, trgi in nastanitvene zmogljivosti; januar 2018–junij 2026.
- **GA4 visit-trzic.com:** 25. 5.–24. 7. 2026; junij 2026 je edini polni skupni mesec.
- **SURS SI-STAT:** letne in mesečne primerjave šestih občin, nastanitvene zmogljivosti in modelni dnevni izdatki.
- **Strategija razvoja turizma 2024–2031:** strateški cilj in ukrepi, ne dejansko stanje.

## Okolje

- **ZENTRA Deževni vrt OŠ Bistrica:** 27. 5.–23. 7. 2026; pet Tankov, globini 15/35 cm, vlažnost, tenziometer in vremenski kontekst.

## Prostorski in pravni okvir

- **OPN Občine Tržič UPB1, Uradni list RS št. 3/2020:** temeljni prostorski akt in okvir omejitev; ni dokaz izvedenih projektov.
- **PISO Desktop — splošna navodila:** tehnični opis sistema, izvoza in dela s sloji.


## Prometni odsek Križe / Retnje — TC25

| Vir | Vsebina | Obdobje | Uporaba | Omejitev |
|---|---|---|---|---|
| Elastic/Kibana — prometni profil | 12-urni intervali, direction, kategorije vozil in število | 11. 7. 2024–4. 8. 2026 | glavni večletni vir | datoteka je poimenovana »Urni profil«, vendar je ločljivost 12 ur |
| Elastic/Kibana — hitrostni izvozi | povprečna/največja hitrost, intervalni P85, >50, >60, >70, >80, >90 | isto obdobje | hitrostni KPI in razredi | vsebini CSV-jev sta zamenjani glede na imeni; popravljeno po ujemanju 1.510 intervalov |
| Neposredni izvoz TC25 | frekvence po smeri jug → sever in sever → jug ter kategorijah | 6. 7.–4. 8. 2026 | kontrola smeri in strukture | krajše obdobje, manj primeren za glavni trend |
| Lokacijski pregled | hiše, pločniki/pešci, priključki, dve smerni AP, OŠ Križe in vrtec | pregled 5. 8. 2026 | opisni prometnovarnostni kontekst | ni terenska inventura |
| Prometne nesreče | še ni pridobljeno | — | prihodnja dopolnitev presoje | odsotnost vira ne pomeni odsotnosti nesreč |

Normalizirana objavna datoteka je `apps/prometni-odseki/data-js/krize-retnje.js`; izvorni CSV-ji in kontrolni izvozi so ohranjeni v `data-source/`.

## Prometni odsek Zvirče — TC25

| Vir | Vsebina | Obdobje | Uporaba | Omejitev |
|---|---|---|---|---|
| Elastic/Kibana prometni profil | 12-urni promet po smereh in kategorijah | 3. 8. 2023–5. 8. 2026 | glavni vir količine in strukture prometa | pet izločenih dni; brez interpolacije |
| Elastic/Kibana hitrosti | povprečna in najvišja hitrost, intervalni P85, pragovi >50 do >90 | isto | glavni hitrostni vir | oznaki direction v imenih datotek sta zamenjani; stolpec 100 ali več ni count |
| Neposredna izvoza TC25 | frekvence po hitrostnih razredih in kategorijah za smeri proti Kranju/Tržiču | 7. 7.–5. 8. 2026 | potrditev smeri in kontrola prenosa | krajše obdobje, različen časovni rez |
| Lokacijski pregled in OPN UPB1 | stanovanjsko naselje, pešci/pločniki, priključki, avtobusni postajališči | pregled 5. 8. 2026 | opisni prometnovarnostni kontekst | ni terenska inventura ali uradna študija |

Potrjena preslikava je `direction 1 = proti Kranju` in `direction 0 = proti Tržiču`. Pri ≥100 km/h je objavljena samo spodnja meja, določena po intervalih z maksimalno hitrostjo najmanj 100 km/h.
