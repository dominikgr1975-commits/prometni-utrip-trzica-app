# Utrip Tržiča — source package v2.0.1

**Izdaja:** 5. avgust 2026  
**Status:** začetek 2. razvojne faze  
**Veljavno izhodišče:** `prometni-utrip-trzica-app-2.0.1-prometni-odseki-v0.2-zvirce`

Utrip Tržiča je statična platforma Občine Tržič za razumljive podatkovne analize, primerjave, simulacije in opisne scenarije. Deluje na GitHub Pages, običajnem spletnem strežniku in neposredno z lokalnega diska. Ni uradna prometna, turistična, okoljska ali finančna študija in ni avtomatski odločevalec.

## 2. razvojna faza

Druga faza se začne z novo aplikacijo **Prometni odseki Tržiča v0.2**, ki uvaja modularno analizo posameznih merilnih odsekov. Aktivna sta odseka Križe / Retnje in Zvirče; izbira odseka osveži celotno analitično stran. Obstoječih šest aplikacij je v tej izdaji vsebinsko nespremenjenih.

## Aktivne aplikacije

| Aplikacija | Verzija | Mapa |
|---|---:|---|
| AI analiza prometa v Tržiču | v1.62 | `apps/analitika/` |
| Prometni utrip Tržiča — javni prikaz | v1.6 | `apps/javni-prikaz/` |
| Prometni odseki Tržiča | v0.2 | `apps/prometni-odseki/` |
| Turistični utrip Tržiča | v0.4 | `apps/turizem/` |
| Uresničevanje Strategije turizma 2024–2031 | v0.1 | `apps/strategija-turizem/` |
| Tržič v turističnem okolju | v0.2 | `apps/turisticno-okolje/` |
| Deževni vrt OŠ Bistrica | v0.1 | `apps/dezevni-vrt/` |

## Nova aplikacija: Prometni odseki

Aplikacija ima ločen register in podatkovne datoteke za odseka Križe / Retnje in Zvirče. Vključuje:

- potrjene smeri za Križe / Retnje (`direction 1 = proti Križam`, `direction 0 = proti Retnjam`) in Zvirče (`direction 1 = proti Kranju`, `direction 0 = proti Tržiču`);
- prometno uteženo povprečno hitrost in intervalno oceno P85;
- števila, deleže in dnevno povprečje prekoračitev;
- primerjavo smeri in 12-urnega tedenskega profila;
- kategorije vozil;
- lokacijski prometnovarnostni kontekst;
- jasno omejitev, da rezultat ni avtomatska odločitev o radarju.

## Enotno verzioniranje

`VERSION.js` je osrednji register verzij platforme, aplikacij in krovnih dokumentov. Skripta `assets/js/apply-version.js` oznake samodejno vstavi v naslove, glave in noge strani.

## Dokumentacija

- `docs/TEHNICNA_DOKUMENTACIJA.md` — tehnična arhitektura in postopek dodajanja odsekov;
- `docs/METODOLOGIJA.md` — skupna metodološka pravila;
- `docs/PODATKOVNI_VIRI.md` — register uporabljenih virov in omejitev;
- `docs/PODATKOVNI_KATALOG.md` — katalog virov in statusov kakovosti;
- `docs/CHANGELOG.md` — sled razvoja;
- `docs/TEMELJI_PLATFORME_UTRIP_TRZICA_v1.5.docx` — krovna metodologija, v tej izdaji vsebinsko nespremenjena;
- `docs/CHANGELOG_UTRIP_TRZICA_v1.7.docx`;
- `docs/PODATKOVNI_KATALOG_UTRIP_TRZICA_v1.3.docx`;
- `docs/TEHNICNA_DOKUMENTACIJA_UTRIP_TRZICA_v2.1.docx`.

## Pravilo sprememb

Spreminjajo se samo izrecno dogovorjene datoteke in funkcionalnosti. Meritve, izračuni, ocene, scenariji in kontekstni podatki morajo biti jasno ločeni. Izvorni izvozi se ohranijo nespremenjeni, normalizacija pa mora biti dokumentirana in ponovljiva.
