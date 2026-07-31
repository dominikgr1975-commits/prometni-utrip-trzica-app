# AI analiza prometa v Tržiču v1.62

**Source package:** v1.9.1  
**Presek prve faze:** 31. 7. 2026

Aplikacija povezuje promet CABLEX, parkirišča, parkirnine, vreme, dogodke, praznike, delovno aktivne, prebivalstvo, turizem, EV polnilnico in prekrške. Namen je razlaga trendov in preverjanje scenarijev, ne uradna napoved.

## Glavne funkcionalnosti

- dnevni, tedenski in mesečni promet; smeri, vrste vozil in hitrosti;
- sedem parkirišč ter kapacitetno uteženi agregati;
- EasyPark in HECTRONIC kot ločena vira;
- dnevni svetovalec za konkreten datum;
- relativni indeks Utrip Tržiča;
- devet opisnih in »what-if« scenarijev;
- turizem, EV, prekrški in prostorski kontekst.

## Dogodki

`events.js` vsebuje 3.547 dnevnih zapisov za obdobje 1. 11. 2023–10. 8. 2026. Večdnevni dogodki so razširjeni na vsak aktiven dan. Dogodek je koledarski kontekst, ne dokaz prometnega učinka ali obiskanosti.

## Občinski prostorski in mobilnostni kontekst

- agregati naselij po 13 krajevnih skupnostih in 35 naseljih;
- zgodovinska evidenca 30 avtobusnih postajališč z dne 15. 1. 2018;
- pregled PISO Desktop slojev BCP, BUS, pločniki, omejitve hitrosti in naselja;
- prazni PISO izvozi Hitrost, Kolesarske poti in Cestne zapore so označeni kot manjkajoči.

Kontekstni viri ne vplivajo na indeks, formule, uteži, korelacije, kakovost ali zanesljivost. PISO podrobnosti so v `data-source/spatial-context/PISO_DESKTOP_IZVOZI.md`.

## Ključne omejitve

- CABLEX je ena lokacija;
- 95 dni med 20. 5. in 22. 8. 2024 je ocenjenih;
- dnevnega EasyPark/HECTRONIC niza ni;
- korelacija ni vzročnost;
- trenutne odstotne ocene zanesljivosti še niso kalibrirane z backtestingom.
