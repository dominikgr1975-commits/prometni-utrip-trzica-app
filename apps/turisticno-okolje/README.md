# Tržič v turističnem okolju v0.1

Samostojna primerjalna aplikacija platforme Utrip Tržiča. Primerja Občino Tržič z občinama Radovljica in Bled na enotni uradni podatkovni osnovi SURS SI-STAT.

## Namen

Aplikacija prikazuje dolgoročni razvoj gostov in nočitev, sezonskost, turistične trge, nastanitvene zmogljivosti ter opisne konkurenčne in prelivne signale. Ne dokazuje gibanja istih gostov med občinami in ne uporablja individualnih podatkov.

## Podatkovni viri

1. **SURS SI-STAT 2164466S** – Prihodi in prenočitve turistov po državah, občine, mesečno. Izbrane občine: Bled, Radovljica, Tržič; obdobje januar 2025–junij 2026; prihodi in prenočitve; vse države. Zadnja objava v izvozu: 24. 7. 2026. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164466S.px
2. **SURS SI-STAT 2164525S** – Prihodi in prenočitve domačih in tujih turistov po občinah, letno. Obdobje 2018–2025. Zadnja objava v izvozu: 18. 3. 2026. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164525S.px
3. **SURS SI-STAT 2164527S** – Prenočitvene zmogljivosti po občinah, letno. Obdobje 2019–2025; nastanitvene enote, vsa in stalna ležišča. Zadnja objava v izvozu: 18. 3. 2026. Vir: https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164527S.px

Izvozi so bili 30. 7. 2026 ročno shranjeni v XLSX. Izvorne datoteke so ohranjene v `data-source/surs/`, normalizirani podatki pa v `data-json/surs-tourism-benchmark.json` in `data-js/surs-tourism-benchmark.js`.

## Metodologija

- Dolgoročni razvoj je prikazan tudi z indeksom 2019 = 100, da velikost Bleda ne prekrije dinamike manjših občin.
- Sezonskost uporablja delež mesečnih nočitev v celoletnih nočitvah 2025.
- Možni neizkoriščeni trgi so države z večjim povprečnim deležem nočitev v Bledu in Radovljici kot v Tržiču ter dovolj velikim skupnim obsegom.
- Nočitve na stalno ležišče so približen kazalnik uporabe zmogljivosti, ne uradna stopnja zasedenosti.
- Konkurenčni in prelivni signali uporabljajo Pearsonovo in Spearmanovo korelacijo mesečnih odstotnih sprememb nočitev z zamiki 0–3 mesece. Korelacija ni dokaz vzročnosti ali gibanja istih gostov.

## Omejitve

Mesečni niz obsega samo 18 mesecev. Podatki zajemajo turiste, prijavljene v nastanitvenih obratih, ne dnevnih obiskovalcev. Na rezultate vplivajo velikost destinacije, struktura nastanitev, cene, dogodki, vreme, promocija in drugi dejavniki, ki v model niso vključeni.

## Tehnika

Aplikacija je statični HTML/CSS/JavaScript, ima lasten CSS in ne uporablja zunanjih knjižnic. Deluje na GitHub Pages, običajnem strežniku in neposredno prek `file:///`.
