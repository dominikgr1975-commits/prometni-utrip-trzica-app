# Podatkovni viri — Utrip Tržiča

**Presek dokumentacije:** 31. 7. 2026. Podrobni vnosi so tudi v `docs/PODATKOVNI_KATALOG.md` in v README-jih posameznih aplikacij.

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
