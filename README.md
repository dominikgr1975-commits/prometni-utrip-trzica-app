# Prometni utrip Tržiča v0.53

Demonstracijska analitična platforma za povezovanje prometa, parkirišč, vremena, koledarskih dejavnikov, prebivalstva, delovno aktivnih oseb in parkirnin.

## Ključne spremembe v0.53

- mesečni podatki SURS 0700941S: delovno aktivne osebe po občini delovnega mesta, junij 2020–maj 2026;
- jasno razlikovanje med prebivalci mesta Tržič in osebami, ki imajo delovno mesto v Občini Tržič;
- opisna korelacija delovno aktivnih s prometom in parkirišči, brez trditve o vzročnosti;
- referenčni urni profil zasedenosti parkirišč za 10.–17. 7. 2026;
- podatki EasyPark in HECTRONIC ter osnovna simulacija prihodka iz parkirnin;
- numerična ocena zanesljivosti pri vseh scenarijih;
- dosledno slovensko oblikovanje števil (npr. 8.354);
- opozorilo o prostorskem obsegu: CABLEX meri glavno cesto proti mestu Tržič, parkirišča pa okolico mestnega jedra, ne celotne občine.

## Pomembne omejitve

Urni profil enega tedna se uporablja samo za razlago vzorca po dnevih in urah. Ne predstavlja večletnega povprečja. Izvoz HECTRONIC nima jasno navedenega obdobja, zato zneski niso sešteti z EasyParkom. Za natančno tarifno simulacijo je treba dodati pravilnik oziroma cenik in kategorije upariti s tarifami.

## Objava

Vsebino mape naloži v branch `v0.53` in ga izberi v **Settings → Pages**. Po objavi uporabi **Ctrl + F5**.


## v0.53 – AI svetovalec
- naravni jezik za scenarije in analize datumov;
- večfaktorska vprašanja: vreme + dogodki + prazniki + delovni dan + promet;
- preverjanje petkove zasedenosti Tržnice na približno 7 tednih 3-urnih podatkov;
- HECTRONIC transakcije in prihodki od 1. 1. 2023 naprej;
- pravni in tarifni kontekst parkiranja;
- jasno ločevanje dejstev, scenarijske ocene in omejitev.
