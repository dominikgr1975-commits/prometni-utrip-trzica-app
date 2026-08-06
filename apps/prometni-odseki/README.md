# Prometni odseki Tržiča v0.2

**Izdaja:** 5. avgust 2026  
**Faza platforme:** 2. razvojna faza  
**Aktivna odseka:** Križe / Retnje in Zvirče

Samostojna aplikacija znotraj platforme Utrip Tržiča je namenjena primerljivi analizi posameznih prometnih odsekov. Izbira odseka v spustnem seznamu zamenja celoten podatkovni in vsebinski prikaz: obdobja, smeri, KPI-je, grafa, tabelo, opisni povzetek, lokacijski kontekst, metodologijo in vire.

## Aktivni odseki

### Križe / Retnje

- lokacija: Cesta Kokrškega odreda, Retnje;
- `direction 1`: Retnje → Križe, proti Križam;
- `direction 0`: Križe → Retnje, proti Retnjam;
- primerljivo obdobje: 12. 7. 2024–3. 8. 2026, 751 popolnih dni;
- neposredni kontrolni izvoz potrjuje fizični smeri in strukturo vozil.

### Zvirče

- lokacija: Zvirče, cestna povezava proti Kranju in Tržiču;
- `direction 1`: Zvirče → Kranj, proti Kranju;
- `direction 0`: Zvirče → Tržič, proti Tržiču;
- primerljivo obdobje: 4. 8. 2023–4. 8. 2026, 1.094 popolnih dni;
- neposredna izvoza TC25 potrjujeta smeri s hitrostnim profilom in strukturo kategorij vozil.

## Kontrola smeri in izvozov Zvirče

Oznaki smeri v imenih dveh hitrostnih CSV-jev ne ustrezata vsebini:

- CSV, poimenovan kot `direction 0` in »proti Kranju«, se v vseh 2.194 skupnih 12-urnih intervalih ujema s profilom `direction 1`;
- CSV, poimenovan kot `direction 1` in »proti Tržiču«, se v vseh 2.194 intervalih ujema s profilom `direction 0`.

Pravilna fizična preslikava je dodatno potrjena z neposrednima izvozoma naprave: smer proti Kranju ima bistveno višji hitrostni profil in manj težjih vozil, smer proti Tržiču pa nižji hitrostni profil in več kombiniranih ter težjih tovornih vozil.

## Kakovost in izključeni dnevi Zvirče

Iz primerljivih izračunov so izločeni:

- 3. 8. 2023 — nepopoln začetni dan;
- 11. 10. 2023 — manjka interval 00:00–12:00 v prometnem profilu;
- 5. 1. 2026 — manjka interval 12:00–24:00;
- 26. 7. 2026 — manjka interval 12:00–24:00;
- 5. 8. 2026 — nepopoln končni interval.

Podatki niso interpolirani.

## Kazalniki in grafa

Aplikacija za oba odseka prikazuje:

- skupno in povprečno dnevno število vozil;
- prometno uteženo povprečno hitrost;
- uteženo povprečje intervalnih P85;
- največjo evidentirano hitrost;
- število, delež in dnevno povprečje prekoračitev;
- neprekrivajoče se hitrostne razrede;
- 12-urni tedenski profil po smereh in kategorijah vozil.

Pri Zvirčah izvorni stolpec »100 ali več« vsebuje maksimalno hitrost in ne števila vozil. Zato je prikazano samo **najmanjše dokazano število**: po eno vozilo za vsak interval, v katerem je maksimalna hitrost dosegla najmanj 100 km/h. Graf vse meritve nad 90 km/h združi v en razred, da ne ustvarja navidezno natančne delitve.

P85 daljšega obdobja je prometno uteženo povprečje P85 posameznih 12-urnih intervalov in ni natančen percentil vseh posameznih vozil.

## Prometnovarnostna razlaga

Odsek Zvirče je umeščen v stanovanjsko naselje s pešci, pločniki, priključki in avtobusnima postajališčema. V neposrednem kontekstu ni osnovne šole. Podatki o prometnih nesrečah za točno lokacijo še niso vključeni. Aplikacija zato ne izreka avtomatske odločitve o radarju, ampak podpira nadaljnjo strokovno presojo nadzora ali drugih ukrepov.

## Datoteke

- `index.html` — generični uporabniški vmesnik za več odsekov;
- `styles.css` — samostojen slog aplikacije;
- `app.js` — dinamični preklop odsekov, preračuni in dva lokalna SVG-grafa;
- `data-js/sections.js` — register aktivnih odsekov;
- `data-js/krize-retnje.js` in `data-js/zvirce.js` — normalizirani podatki;
- `data-source/elastic/` — nespremenjeni izvozi Elastic/Kibana;
- `data-source/control/` — neposredni kontrolni izvozi naprav TC25.

Aplikacija ne potrebuje zunanjih knjižnic in deluje na GitHub Pages, običajnem spletnem strežniku ter prek `file:///`.
