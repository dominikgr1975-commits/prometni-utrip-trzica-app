# Podatkovni viri

Podrobni podatkovni viri so navedeni v posameznih aplikacijah. Novi viri se vključijo samo, kadar vsebinsko sodijo v model in lahko izboljšajo razlage ali zanesljivost ocen.

## Dogodki

- Datoteka aplikacije: `apps/analitika/data-js/events.js`.
- Vir: CSV izvoz koledarja dogodkov Občine Tržič; prihodnji dogodki po 28. 7. 2026 so dopolnjeni iz obstoječega XML nabora.
- Obdobje dnevnih zapisov: 1. 11. 2023–10. 8. 2026.
- Število zapisov: 3.547 dnevnih zapisov.
- Časovna ločljivost: posamezen koledarski dan.
- Večdnevni dogodki so razširjeni na vsak aktiven dan, da jih dnevni svetovalec najde na vseh datumih trajanja.
- Omejitev: mesečna komponenta Dogodki meri aktivne dneve dogodkov, ne števila različnih prireditev, njihove velikosti, obiskanosti ali dokazanega prometnega vpliva.


## Prekrški

- Vir: občinski izvoz iz Elasticsearch/Kibana.
- Obdobje: 2019-07 do 2026-07.
- Časovna ločljivost: mesečno.
- Prostorska ločljivost: ulica; Tržič in bližnja okolica.
- CABLEX je na Cesti Ste Marie Aux Mines.
- Podatki so dejansko evidentirane vrednosti; manjkajoča obdobja niso avtomatsko nadomeščena brez dodatne presoje.

## Turizem – nastanitvene zmogljivosti

- Datoteka aplikacije: `apps/turizem/data-js/tourism-accommodation.js`.
- Vir: občinski izvoz iz Elasticsearch/Kibana (`turisticne_takse`).
- Obdobje: 2018-01 do 2026-06.
- Časovna ločljivost: mesečno.
- Podatki: gostje, nočitve, razpoložljive posteljne noči, razpoložljiva ležišča in stopnja zasedenosti.
- Zasedenost se izračuna kot `nočitve / razpoložljive posteljne noči`.
- Razpoložljiva ležišča se izračunajo kot `razpoložljive posteljne noči / število dni v mesecu`.
- Število razpoložljivih ležišč se med meseci spreminja, zato scenarijski model uporablja mesečne kapacitete.

## Turizem – osnovni kazalniki

- Datoteka aplikacije: `apps/turizem/data-js/tourism-summary.js`.
- Vir: aplikacija obveznega poročanja o turističnih taksah; podatki so povzeti iz obstoječega sklopa analitične aplikacije.
- Obdobje: 2018-01 do 2026-06.
- Časovna ločljivost: mesečno in letno.
- Podatki: gostje, nočitve, letni znesek turistične takse in kumulativni gostje po krajih nastanitve.
- Omejitev: podatki ne zajemajo dnevnih gostov, ki se nikamor ne prijavljajo.

## Turizem – turistični trgi

- Datoteka aplikacije: `apps/turizem/data-js/tourism-markets.js`.
- Vir: občinski izvoz iz Elasticsearch/Kibana (`turisticne_takse`).
- Obdobje: 2018-01 do 2026-06.
- Časovna ločljivost: mesečno po državi.
- Podatki: gostje in nočitve po turističnem trgu.
- Kibana `Top values` je bil nastavljen na 250; v izvozu je 64 trgov.
- Negativni zapis Italija, 2022-11, −136 nočitev ostaja v izvornih podatkih, pri agregacijah pa se ne sešteva.
