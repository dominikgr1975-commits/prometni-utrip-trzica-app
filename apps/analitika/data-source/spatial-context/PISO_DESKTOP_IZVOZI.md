# PISO Desktop — pregled izvozov za Utrip Tržiča

**Datum izvoza in pregleda:** 31. 7. 2026  
**Vloga v prvi fazi:** prostorski in mobilnostni kontekst; brez vpliva na izračune.

PISO Desktop omogoča izvoz atributnih tabel slojev. Gre za atributne izvoze brez geometrije, zato jih ni mogoče samostojno prikazati na karti. Ključ za prihodnje povezovanje so polja `ODSEK`, `STAC_ZAC`, `STAC_KON`, `ID` in po potrebi `CESTA`.

## Povzetek

| Datoteka | Zapisi | Glavna vsebina | Ocena uporabnosti |
|---|---:|---|---|
| `bcp.xlsx` | 275 | osi občinskih cest, kategorija, dolžina, veljavnost | zelo uporabna referenčna osnova, ko bo dodana geometrija |
| `bus.xlsx` | 32 | postajališča in infrastrukturni atributi | uporabno z omejitvami; manjkata imena in geometrija |
| `plocnik.xlsx` / `plocnik.csv` | 156 | širina, lega, material in vrsta pločnika | najbolj uporaben novi sloj za peš dostopnost |
| `omejitevhitrost.xlsx` | 52 | omejitev hitrosti po odseku/stacionaži | uporaben prometni kontekst, ne popoln register |
| `naselja.xlsx` | 269 | pripadnost delov cestnih odsekov šifram naselij | uporabno za agregiranje po naselbinskem kontekstu |
| `hitrost.xlsx` | 0 | samo glava | neuporabno; ni meritev ali atributov |
| Kolesarske poti (`kolesarske.xlsx`) | 0 | samo glava | neuporabno; ni dokaz, da poti ni |
| Cestne zapore (`cestne zopore(1).xlsx`) | 0 | samo glava | neuporabno; ni zgodovine zapor |

## Preverjeni agregati

### BCP — osi občinskih cest

- 275 zapisov in 96 šifer cest;
- vsota polja `DOLZINA`: 114.651 m;
- kategorije: 253 JP, 20 LC in 2 LZ;
- zadnji datum spremembe v izvozu sega do 11. 11. 2025.

### Pločniki

- 156 zapisov, od tega 154 z odprtim datumom veljavnosti;
- vsota `DOLZINA` za trenutno veljavne zapise: 12.880 m;
- 30 različnih cestnih odsekov;
- povprečna širina 1,54 m, mediana 1,50 m, razpon 0,50–3,50 m;
- širinski razredi: 18 zapisov do 1,00 m; 60 zapisov 1,01–1,50 m; 59 zapisov 1,51–2,00 m; 17 zapisov nad 2,00 m;
- zadnja sprememba v izvozu: 20. 5. 2026.

### Omejitve hitrosti

- 52 zapisov, od tega 46 trenutno veljavnih;
- 18 različnih cestnih odsekov;
- veljavni zapisi: 1 × 20 km/h, 7 × 30 km/h, 35 × 40 km/h in 3 × 70 km/h;
- vsota `DOLZINA` veljavnih zapisov: 14.622 m.

### BUS

- 32 zapisov na 8 cestnih odsekih;
- 17 zapisov na levi in 15 na desni strani;
- atributi vključujejo širino, čakalni prostor, pločnik, prehod, javno razsvetljavo ter vertikalne in horizontalne označbe;
- kode pomenov niso dokončno interpretirane brez šifranta.

### Naselja ob cestnih odsekih

- 269 zapisov, od tega 261 trenutno veljavnih;
- 33 različnih šifer naselij;
- gre za linearno pripadnost cestnih delov naselju, ne za register vseh naselij ali poligone mej.

## Omejitve in nadaljnji korak

1. Pridobiti SHP, GPKG ali GeoJSON z istočasnimi atributi in navedenim CRS.
2. Pridobiti uradne šifrante za kategorije in kodirana polja.
3. Potrditi, ali izvozi predstavljajo popolno in trenutno občinsko evidenco.
4. Povezati odseke z lokacijami CABLEX, parkirišč, postajališč in turističnih točk šele po geometrijskem preverjanju.
5. PISO v prvi fazi ostane kontekst; velike karte in prostorske simulacije se prestavijo v naslednjo fazo.
