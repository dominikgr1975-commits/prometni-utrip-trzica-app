# Tržič v turističnem okolju v0.2

Samostojna primerjalna aplikacija platforme Utrip Tržiča. Občino Tržič primerja z Radovljico, Bledom, Preddvorom, Jesenicami in Idrijo na enotni uradni podatkovni osnovi SURS SI-STAT.

## Namen

Aplikacija prikazuje dolgoročni razvoj gostov in nočitev, sezonskost, turistične trge, nastanitvene zmogljivosti, okvirno modelno potrošnjo tujih turistov ter opisne konkurenčne in prelivne signale. Ne dokazuje gibanja istih gostov med občinami in ne uporablja individualnih podatkov.

## Podatkovni viri

Izvozi so bili 30. 7. 2026 ročno shranjeni iz SURS SI-STAT v obliki XLSX.

1. **SURS SI-STAT 2164466S** – Prihodi in prenočitve turistov po državah, občine, mesečno. Izbrane občine: Bled, Idrija, Jesenice, Preddvor, Radovljica in Tržič; obdobje januar 2020–junij 2026; prihodi in prenočitve; vse objavljene države. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164466S.px
2. **SURS SI-STAT 2164525S** – Prihodi in prenočitve domačih in tujih turistov po občinah, letno. Šest občin; obdobje 2018–2025. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164525S.px
3. **SURS SI-STAT 2164527S** – Prenočitvene zmogljivosti po občinah, letno. Šest občin; obdobje 2019–2025; nedeljive enote, vsa in stalna ležišča. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164527S.px
4. **SURS SI-STAT 2176731S** – Povprečni dnevni izdatki na tujega turista po vrsti občine in državi prebivališča, obdobno. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2176731S.px
5. **SURS SI-STAT 2176740S** – Struktura povprečnih dnevnih izdatkov na tujega turista po vrsti občine in vrsti izdatka, obdobno. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2176740S.px
6. **SURS SI-STAT 2176737S** – Povprečni dnevni izdatki na tujega turista po vrsti občine in vrsti nastanitvenega obrata v glavni sezoni. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2176737S.px
7. **SURS KLASJE – eTUR_VrsteOBCIN** – klasifikacija vrst turističnih občin. Bled, Jesenice, Preddvor, Radovljica in Tržič so gorske občine; Idrija je med ostalimi občinami, v tabelah potrošnje pa je vključena v skupino »Mestne občine in druge občine«. Vir: https://www.stat.si/Klasje/Klasje/Tabela/15827

Izvorne XLSX-datoteke so ohranjene v `data-source/surs/`. Normalizirani podatki so zapisani v:

- `data-json/surs-tourism-benchmark.json`
- `data-js/surs-tourism-benchmark.js`

## Metodologija turistične primerjave

- Dolgoročni razvoj je prikazan tudi z indeksom 2019 = 100, da velikost Bleda ne prekrije dinamike manjših občin.
- Sezonskost uporablja delež mesečnih nočitev v celoletnih nočitvah 2025.
- Možni neizkoriščeni trgi so države, katerih delež v združenih tujih nočitvah primerjalnih občin s popolnimi mesečnimi podatki presega delež v Tržiču in imajo hkrati dovolj velik skupni obseg. Preddvor je zaradi zaščitenih mesečnih vrednosti v letu 2025 iz tega izračuna izključen.
- Nočitve na stalno ležišče so približen kazalnik uporabe zmogljivosti, ne uradna stopnja zasedenosti.
- Konkurenčni in prelivni signali uporabljajo Pearsonovo in Spearmanovo korelacijo medletnih mesečnih sprememb nočitev od januarja 2023 do junija 2026 z zamiki 0–3 mesece. Uporaba medletnih sprememb zmanjša vpliv običajne sezonskosti. Korelacija ni dokaz vzročnosti ali gibanja istih gostov.

## Metodologija modelne potrošnje

Model velja samo za **tuje nočitve v letu 2025**:

1. Mesečne tuje nočitve so razdeljene po trgih iz tabele 2164466S.
2. Trgi so povezani s skupinami v tabeli 2176731S: Avstrija, Italija, Nemčija, Beneluks, druge evropske države in neevropske države.
3. Vsaka občina uporablja vrednosti svoje uradne vrste turistične občine. Pet občin uporablja skupino gorskih občin, Idrija pa skupino mestnih in drugih občin.
4. Za mesece brez neposrednega anketnega obdobja se dnevni izdatek interpolira med najbližjima razpoložljivima dvomesečjema leta 2025. Pri zaščitenih mesečnih podatkih Preddvora se razlika do uradnega letnega števila tujih nočitev ovrednoti s povprečno modelno porabo njegovih objavljenih mesecev.
5. Modelna potrošnja je vsota `tuje nočitve × ocenjeni povprečni dnevni izdatek`.
6. Struktura potrošnje se izračuna iz tabele 2176740S za nastanitev, hrano in pijačo, prevoz po Sloveniji, druge nakupe, kulturo/šport/izlete in druge izdatke.
7. Orientacijski razpon uporablja najnižjo in najvišjo uradno vrednost dnevne potrošnje, objavljeno za ustrezno vrsto občine v letu 2025, skupaj s poletnima vrednostma za hotele in kampe. To ni interval zaupanja.

Modelna potrošnja **ni dejanski prihodek podjetij v občini**. SURS-ov povprečni dnevni izdatek vključuje izdatke med bivanjem v Sloveniji, zato del potrošnje lahko nastane zunaj občine, kjer je turist prenočeval. V juliju–avgustu so v anketi vključeni hoteli in kampi, v drugih dvomesečjih pa praviloma samo hoteli. Posamezne objavljene vrednosti so lahko označene z oznako manjše zanesljivosti; manjkajoča tržna vrednost se v modelu nadomesti s skupnim povprečjem iste vrste občine in obdobja.

## Omejitve

Podatki zajemajo prijavljene turiste v nastanitvenih obratih, ne dnevnih obiskovalcev. SURS je pri Preddvoru nekatere mesečne vrednosti označil z »z« zaradi statistične zaščite; aplikacija jih ohrani kot manjkajoče in jih ne pretvori v nič. Na rezultate vplivajo velikost destinacije, struktura in cene nastanitev, dogodki, vreme, promocija, prometna dostopnost in drugi dejavniki, ki v model niso vključeni. Razpon modelne potrošnje je analiza občutljivosti, ne verjetnostni interval.

## Tehnika

Aplikacija je statični HTML/CSS/JavaScript, ima lasten CSS in ne uporablja zunanjih knjižnic. Deluje na GitHub Pages, običajnem strežniku in neposredno prek `file:///`.

## Spremembe v0.2

- Dodane občine Idrija, Jesenice in Preddvor.
- Mesečni niz razširjen z 18 na 78 mesecev: januar 2020–junij 2026.
- Prelivni signali prenovljeni na medletne spremembe od januarja 2023 naprej.
- Priložnostni trgi se primerjajo z združenim obsegom vseh petih primerjalnih občin.
- Dodan model okvirne potrošnje tujih turistov in ocenjena struktura potrošnje za Tržič.
- Dodani trije novi izvorni SURS izvozi o izdatkih.
- Vsi izvorni XLSX-izvozi, normalizirani JSON in JavaScript so posodobljeni.
