# Utrip Tržiča — source package v1.9.1

**Presek:** 31. julij 2026  
**Status:** zaključek prve razvojne faze  
**Zadnje potrjeno izhodišče:** `prometni-utrip-trzica-app-1.9.1-prostorski-kontekst`

Utrip Tržiča je statična platforma Občine Tržič za razumljive podatkovne analize, primerjave, simulacije in opisne scenarije. Deluje na GitHub Pages, običajnem spletnem strežniku in neposredno z lokalnega diska. Ni uradna prometna, turistična, okoljska ali finančna študija in ni avtomatski odločevalec.

## Aktivne aplikacije

| Aplikacija | Verzija | Mapa |
|---|---:|---|
| AI analiza prometa v Tržiču | v1.62 | `apps/analitika/` |
| Prometni utrip Tržiča — javni prikaz | v1.6 | `apps/javni-prikaz/` |
| Turistični utrip Tržiča | v0.4 | `apps/turizem/` |
| Uresničevanje Strategije turizma 2024–2031 | v0.1 | `apps/strategija-turizem/` |
| Tržič v turističnem okolju | v0.2 | `apps/turisticno-okolje/` |
| Deževni vrt OŠ Bistrica | v0.1 | `apps/dezevni-vrt/` |

## Enotno verzioniranje

`VERSION.js` je osrednji register verzij platforme, aplikacij in krovnih dokumentov. Skripta `assets/js/apply-version.js` oznake samodejno vstavi v naslove, glave in noge strani. Statična besedila ostanejo pravilna tudi, kadar je JavaScript izklopljen.

Ob vsaki izdaji je treba uskladiti še:

- ime ZIP-paketa;
- `VERSION.js`;
- korenski in aplikacijski README;
- `docs/CHANGELOG.md`, `docs/METODOLOGIJA.md` in `docs/PODATKOVNI_VIRI.md`;
- krovne Word dokumente.

## Prostorski kontekst PISO

V prvi fazi so bili pregledani atributni izvozi PISO Desktop za občinske cestne odseke, avtobusna postajališča, pločnike, omejitve hitrosti in pripadnost cestnih odsekov naseljem. Izvozi so uporabljeni samo kot občinski prostorski in mobilnostni kontekst. Ne spreminjajo formul, uteži, indeksa Utrip Tržiča ali ocen zanesljivosti. Podrobnosti so v `apps/analitika/data-source/spatial-context/PISO_DESKTOP_IZVOZI.md`.

Izvozi slojev **Hitrost**, **Kolesarske poti** in **Cestne zapore** niso vsebovali podatkovnih vrstic; to je evidentirano kot manjkajoč vir in ne kot vrednost nič.

## Dokumentacija

- `docs/METODOLOGIJA.md` — skupna metodološka pravila;
- `docs/PODATKOVNI_VIRI.md` — register uporabljenih virov in omejitev;
- `docs/PODATKOVNI_KATALOG.md` — katalog virov in statusov kakovosti;
- `docs/CHANGELOG.md` — sled razvoja in zaključek prve faze;
- `docs/TEMELJI_PLATFORME_UTRIP_TRZICA_v1.5.docx` — krovna metodologija in kontekst;
- `docs/CHANGELOG_UTRIP_TRZICA_v1.5.docx` — celovit kronološki pregled razvoja;
- `docs/PODATKOVNI_KATALOG_UTRIP_TRZICA_v1.1.docx` — formalni register podatkovnih virov.

## Pravilo sprememb

Spreminjajo se samo izrecno dogovorjene datoteke in funkcionalnosti. Meritve, izračuni, ocene, scenariji in kontekstni podatki morajo biti jasno ločeni. Prazni ali nepopolni viri se ne nadomeščajo z izmišljenimi podatki.
