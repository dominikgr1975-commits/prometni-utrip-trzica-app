# Podatkovni viri — Prometni odseki Tržiča v0.2

Izvorne datoteke so ohranjene nespremenjene zaradi revizijske sledi. Popravki smeri, izločanje nepopolnih dni in drugi postopki so izvedeni samo v normaliziranih datotekah `data-js/`.

## Križe / Retnje

- `elastic/` vsebuje tri 12-urne izvoze Elastic/Kibana;
- `control/` vsebuje neposredna kontrolna izvoza TC25 in vzorec JSON;
- potrjeno: `direction 1 = proti Križam`, `direction 0 = proti Retnjam`.

## Zvirče

### Elastic/Kibana

Mapa `elastic/zvirce/` vsebuje:

1. 12-urni promet in kategorije vozil po obeh smereh;
2. povprečno in največjo hitrost, intervalni P85 ter kumulativne pragove iz izvoza z nazivom »proti Kranju (direction 0)«;
3. enake kazalnike iz izvoza z nazivom »proti Tržiču (direction 1)«.

Vsebina pokaže, da sta oznaki direction v imenih hitrostnih datotek zamenjani. Prva datoteka se v vseh 2.194 skupnih intervalih ujema s profilom `direction 1`, druga pa s profilom `direction 0`.

### Neposredni izvoz TC25

Mapa `control/zvirce/` vsebuje frekvenčna izvoza za smeri proti Kranju in proti Tržiču. Uporabljena sta za:

- potrditev fizičnih smeri;
- primerjavo hitrostne porazdelitve;
- primerjavo kategorij vozil;
- kontrolo prenosa v Elastic.

Pravilna preslikava:

- `direction 1 = Zvirče → Kranj`;
- `direction 0 = Zvirče → Tržič`.

Manjše razlike v skupnem številu med neposrednim izvozom in Elasticom so povezane z različnim časovnim rezom, zamikom prenosa oziroma zaključkom zadnjega intervala. Smer je potrjena z značilnim hitrostnim profilom in strukturo vozil, ne samo s skupnim seštevkom.

## Omejitev ≥100 km/h

Stolpec »100 ali več« v hitrostnih izvozih ni število, ampak praviloma ponovljena maksimalna hitrost. Za Zvirče je zato izračunana samo spodnja meja: vsak interval z `maxSpeed >= 100` dokazuje najmanj eno takšno vozilo. Dejanski obseg je lahko višji.
