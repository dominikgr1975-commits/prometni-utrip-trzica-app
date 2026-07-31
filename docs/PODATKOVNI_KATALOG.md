# Podatkovni katalog — Utrip Tržiča v1.1

**Izhodišče:** source package v1.9.1, TEMELJI PLATFORME v1.5, CHANGELOG v1.5.  
**Datum:** 31. 7. 2026.

## Statusi kakovosti

- **A — preverjeno:** definicija, obdobje in kontrole so potrjene.
- **B — uporabno z omejitvami:** znane vrzeli ali omejen prostorski obseg.
- **C — delno/začasno:** kratek niz ali nepotrjena definicija; samo opisna uporaba.
- **D — ocenjeno:** modelno ali interpolirano; vedno ločeno od meritev.
- **E — neuporabno/manjka:** brez podatkovnih vrstic, neznan pomen ali neprimerljiv prelom.

## PISO Desktop in prostorski kontekst

| ID | Vir | Obseg | Q | Omejitev |
|---|---|---|:--:|---|
| GIS-001 | OPN Občine Tržič UPB1 | celotna občina | A | pravni okvir, ne izvedba |
| GIS-002 | Naselja po KS in naslovne točke 2024 | 13 KS, 35 naselij, 2.881 naslovnih točk | B | javno samo agregati; prijave niso unikatne osebe |
| GIS-003 | Evidenca postajališč 15. 1. 2018 | 30 lokacij, 57 smeri | C | zgodovinsko, brez koordinat |
| GIS-004 | PISO BCP osi občinskih cest | 275 zapisov, 114.651 m | B | XLSX brez geometrije in šifranta |
| GIS-005 | PISO BUS | 32 zapisov na 8 odsekih | C | brez imen/koordinat; kode niso potrjene |
| GIS-006 | PISO pločniki | 156 zapisov, 154 veljavnih, 12.880 m | B | brez geometrije; popolnost ni potrjena |
| GIS-007 | PISO omejitve hitrosti | 52 zapisov, 46 veljavnih, 14.622 m | B | ni potrjeno, da gre za popoln register omrežja |
| GIS-008 | PISO naselja ob cestnih odsekih | 269 zapisov, 261 veljavnih, 33 šifer naselij | B | linearni odseki, ne poligoni naselij |
| GIS-009 | PISO Hitrost | brez vrstic | E | vir manjka; ni meritev in ni vrednost nič |
| GIS-010 | PISO Kolesarske poti | brez vrstic | E | vir manjka; ne dokazuje odsotnosti poti |
| GIS-011 | PISO Cestne zapore | brez vrstic | E | vir manjka; ni zgodovine zapor |
| GIS-012 | PISO Desktop navodila | splošna navodila, december 2015 | B | opis načina dela, ne aktualnosti občinskih podatkov |

## Pravilo uporabe PISO

Atributni izvoz je dovoljen za opisni in metodološki kontekst. V formule in scenarije se vključi šele po pridobitvi geometrije, šifrantov, podatka o veljavnosti in preverjanju popolnosti. Prazna tabela se ne razlaga kot odsotnost pojava.

Podrobni prometni, turistični, okoljski in dokumentacijski viri so navedeni v `docs/PODATKOVNI_VIRI.md` in posameznih README-jih.
