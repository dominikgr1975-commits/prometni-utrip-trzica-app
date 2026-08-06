# Tehnična dokumentacija — Utrip Tržiča v2.1

**Izdaja:** 5. avgust 2026  
**Source package:** `prometni-utrip-trzica-app-2.0.1-prometni-odseki-v0.2-zvirce`  
**Razvojna faza:** 2. razvojna faza

## 1. Arhitektura

Platforma ostaja statični HTML/CSS/JavaScript paket brez strežniške baze, gradnika ali zunanjega JavaScript ogrodja. Relativne povezave omogočajo delovanje na GitHub Pages, običajnem strežniku in lokalno prek `file:///`.

`VERSION.js` je centralni register oznak. Vstopna platforma ostaja v2.0, aplikacija Prometni odseki pa je posodobljena na v0.2. Korenski `index.html` v tej izdaji ni spremenjen.

## 2. Struktura aplikacije Prometni odseki

```text
apps/prometni-odseki/
├── index.html
├── styles.css
├── app.js
├── README.md
├── data-js/
│   ├── sections.js
│   ├── krize-retnje.js
│   └── zvirce.js
└── data-source/
    ├── README.md
    ├── elastic/
    │   └── zvirce/
    └── control/
        └── zvirce/
```

`sections.js` vsebuje dva aktivna odseka. `app.js` ni več vezan na en podatkovni objekt: ob spremembi odseka ponovno sestavi obdobja in smeri ter osveži hero, lokacijsko kartico, KPI-je, oba grafa, tabelo, opisni povzetek, kontekst, metodologijo in vire.

## 3. Skupni podatkovni model

En normalizirani zapis predstavlja en 12-urni interval ene smeri. Ključna polja so:

- `date`, `hour`, `direction`;
- `status` in `statusNote`;
- `vehicles` in `vehicleTypes`;
- `averageSpeed`, `maxSpeed`, `p85Interval`;
- `over50`, `over60`, `over70`, `over80`, `over90`, `atLeast100`.

Vsak odsek vsebuje lastne metapodatke o smereh, obdobju, izključenih dnevih, kartografskem kontekstu in načinu obravnave praga 100 km/h.

## 4. Odsek Križe / Retnje

Podatki in izračuni ostajajo vsebinsko nespremenjeni. Pravilna preslikava je:

- `direction 1 = Retnje → Križe`;
- `direction 0 = Križe → Retnje`.

Primerljivo obdobje vsebuje 751 popolnih dni med 12. 7. 2024 in 3. 8. 2026.

## 5. Odsek Zvirče

### 5.1 Smeri

Analiza 2.194 skupnih 12-urnih intervalov pokaže:

- hitrostna datoteka z oznako `direction 0` in nazivom »proti Kranju« se 100-odstotno ujema s profilom `direction 1`;
- hitrostna datoteka z oznako `direction 1` in nazivom »proti Tržiču« se 100-odstotno ujema s profilom `direction 0`.

Neposredna izvoza TC25 potrjujeta fizični smeri z razlikami v hitrostni porazdelitvi in kategorijah vozil:

- `direction 1 = Zvirče → Kranj`;
- `direction 0 = Zvirče → Tržič`.

### 5.2 Obdobje in kakovost

Izvorni profil obsega 3. 8. 2023 12:00–5. 8. 2026 12:00. Primerljivo obdobje vsebuje 1.094 popolnih dni med 4. 8. 2023 in 4. 8. 2026. Izločeni so 3. 8. 2023, 11. 10. 2023, 5. 1. 2026, 26. 7. 2026 in 5. 8. 2026. Podatki niso interpolirani.

### 5.3 Prag 100 km/h

Izvorni stolpec »100 ali več« vsebuje največjo hitrost, ne števila vozil. Pri Zvirčah ima del intervalov več kot eno vozilo nad 90 km/h, zato natančnega števila ≥100 ni mogoče rekonstruirati. `atLeast100` predstavlja spodnjo mejo: po eno dokazano vozilo za vsak interval z maksimalno hitrostjo najmanj 100 km/h. Graf zato uporablja skupni razred nad 90 km/h, tabela pa spodnjo mejo označi z `≥`.

## 6. Izračuni in grafa

- skupno vozil: vsota popolnih intervalov na popolnih dnevih;
- povprečno na dan: skupno / število popolnih dni;
- povprečna hitrost: `Σ(vozila × intervalno povprečje) / Σ vozila`;
- prikazani P85: `Σ(vozila × intervalni P85) / Σ vozila`;
- najvišja hitrost: maksimum intervalnih maksimumov;
- hitrostni razredi: odštevanje zaporednih kumulativnih pragov;
- 12-urni profil: povprečje popolnih intervalov po dnevu v tednu in polovici dneva.

Graf 1 uporablja logaritemsko dolžino pri absolutnih vrednostih in vedno izpiše natančno številko. Graf 2 omogoča preklop med smermi in kategorijami vozil. P85 za daljše obdobje ostaja intervalna ocena, ne natančen percentil vseh posameznih meritev.

## 7. Lokacijski kontekst

Križe / Retnje vključuje stanovanjske hiše, pešce, pločnike, priključke, dve smerni postajališči ter bližnjo OŠ Križe in vrtec. Zvirče vključuje stanovanjsko naselje, pešce in pločnike, priključke, avtobusni postajališči in povezovalno funkcijo ceste; v neposrednem kontekstu ni osnovne šole.

Podatki o prometnih nesrečah za točni lokaciji še niso vključeni. Aplikacija ne odloča o radarju, ampak podpira nadaljnjo strokovno in terensko presojo.

## 8. Kontrola izdaje

- `node --check` za spremenjene JavaScript datoteke;
- 100-odstotno ujemanje smernih izvozov z 12-urnim profilom;
- kategorije vozil seštejejo v skupno število;
- pragovi so monotoni in ne presegajo števila vozil;
- oba odseka se dinamično naložita in osvežita celotno stran;
- izračuni uporabljajo samo popolne dneve;
- korenski `index.html` in druge aplikacije so nespremenjeni;
- dokumentacija, `VERSION.js` in ime ZIP-a so usklajeni.
