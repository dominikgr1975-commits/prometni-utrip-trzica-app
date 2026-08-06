# Podatkovni katalog — Utrip Tržiča v1.3

**Izhodišče:** source package v2.0.1, TEMELJI PLATFORME v1.5, CHANGELOG v1.7.  
**Datum:** 5. 8. 2026.  
**Razvojna faza:** 2. razvojna faza.

## Statusi kakovosti

- **A — preverjeno:** definicija, obdobje in kontrole so potrjene.
- **B — uporabno z omejitvami:** znane vrzeli ali omejen prostorski obseg.
- **C — delno/začasno:** kratek niz ali nepotrjena definicija; samo opisna uporaba.
- **D — ocenjeno:** modelno ali interpolirano; vedno ločeno od meritev.
- **E — neuporabno/manjka:** brez podatkovnih vrstic, neznan pomen ali neprimerljiv prelom.

## Viri aplikacije Prometni odseki

| ID | Vir | Obseg | Obdobje | Q | Ključna omejitev |
|---|---|---|---|:--:|---|
| TRF-008 | TC25 Križe / Retnje — Elastic/Kibana | 12-urni promet, smer, vrste vozil, hitrost in pragovi | 11. 7. 2024–4. 8. 2026; 751 popolnih dni | B | P85 je utežena intervalna ocena; izključeni nepopolni dnevi |
| TRF-009 | TC25 Križe / Retnje — neposredni kontrolni izvoz | frekvence po kategorijah in smereh | 6. 7.–4. 8. 2026 | A/B | krajše kontrolno obdobje |
| TRF-010 | Prometne nesreče Križe / Retnje | načrtovani vir | ni pridobljeno | E | brez podatkov ni dovoljeno sklepati, da nesreč ni |
| TRF-011 | TC25 Zvirče — Elastic/Kibana | 12-urni promet, smer, vrste vozil, povprečna/največja hitrost, intervalni P85 in pragovi | 3. 8. 2023–5. 8. 2026; 1.094 popolnih dni | B | pet izločenih dni; oznaki direction v imenih hitrostnih CSV-jev sta zamenjani; ≥100 je spodnja meja |
| TRF-012 | TC25 Zvirče — neposredni kontrolni izvoz | frekvence po hitrostnih razredih in kategorijah za smeri proti Kranju in proti Tržiču | 7. 7.–5. 8. 2026 | A/B | krajše obdobje in manjša odstopanja zaradi časovnega reza/prenosa; uporablja se za smeri in kontrolo |
| TRF-013 | Prometne nesreče Zvirče | načrtovani vir | ni pridobljeno | E | brez podatkov ni dovoljeno sklepati, da nesreč ni |
| CTX-006 | Lokacijski kontekst Križe / Retnje | hiše, pešci/pločniki, priključki, dve smerni AP, OŠ Križe in vrtec | pregled 5. 8. 2026 | B | opisni pregled, ne terenska inventura |
| CTX-007 | Prijava prebivalca — Križe / Retnje | ena pritožba zaradi hitrosti | do 5. 8. 2026 | C | povod za merjenje, ne dokaz splošnega stališča |
| CTX-008 | Lokacijski kontekst Zvirče | stanovanjsko naselje, pešci/pločniki, priključki, avtobusni postajališči in povezovalna cesta | pregled 5. 8. 2026 | B | brez OŠ v neposrednem kontekstu; opisni pregled, ne prometnovarnostna študija |

## Pravila za TRF-011

- `direction 1 = Zvirče → Kranj`, `direction 0 = Zvirče → Tržič`;
- smeri sta potrjeni s 100-odstotnim ujemanjem 2.194 intervalov in neposrednima izvozoma TC25;
- izračuni vključujejo samo popolne dneve;
- povprečna hitrost in P85 sta prometno utežena;
- P85 daljšega obdobja ni natančen percentil vseh posameznih vozil;
- `atLeast100` je spodnja meja, ne natančno število;
- največja hitrost sama ni dokaz sistemskega problema;
- radar ni avtomatski rezultat aplikacije.

## PISO Desktop in prostorski kontekst

Obstoječi viri GIS-001–GIS-012 ostajajo nespremenjeni. OPN UPB1 potrjuje Zvirče kot naselje s pomembno stanovanjsko rabo. Atributni PISO izvozi brez geometrije ne omogočajo natančnega samostojnega kartiranja lokacije merilnika.

Podrobni prometni, turistični, okoljski in dokumentacijski viri so navedeni v `docs/PODATKOVNI_VIRI.md` in posameznih README-jih.
