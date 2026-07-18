# v1.4.1

- Popravljena izbira obdobja v javni aplikaciji; možnosti se zdaj ustvarijo iz dejansko razpoložljivih let.
- Ob menjavi obdobja se osvežijo graf delavnikov/vikendov/praznikov, sestava vozil, povprečni dnevni promet in opis izbranega obdobja.
- Omejitev hitrosti na merilnem mestu CABLEX popravljena na 40 km/h.

# Spremembe

## v1.4.1 · julij 2026

- Dodana javna aplikacija **Prometni utrip Tržiča**.
- Dodan prikaz sezonske zasedenosti parkirišč.
- Dodan interaktivni dnevno-urni profil za vsako spremljano parkirišče.
- Dodane povprečne hitrosti CABLEX po kategorijah vozil.
- Dodana primerjava prometa med delavniki, vikendi in prazniki z izbiro obdobja.
- Dodan prikaz sestave vozil za izbrano obdobje.
- Merilno mesto CABLEX je navedeno kot Cesta Ste Marie Aux Mines.

## v1.4.1
- Utrip Tržiča je spremenjen v relativni indeks, kjer 100 pomeni običajno aktivnost primerljivega obdobja.
- Dodana je izbira obdobja: zadnji 3, 6 ali 12 mesecev, tekoče leto, celotno obdobje ali poljuben razpon mesecev.
- Indeks se preračuna za izbrano obdobje in prikaže ločene komponente prometa, parkiranja, parkirnin, dogodkov, turizma in vremena.
- Dodana je razumljiva razlaga pomena vrednosti in primerjava z običajnim sezonsko primerljivim stanjem.

## v1.4.1 · julij 2026

- Dodan podatkovni sklop prekrškov po mesecih in ulicah za obdobje 2019–2026.
- Dodana grafa mesečnega trenda in razporeditve prekrškov po ulicah.
- Prekrški vključeni v enotni podatkovni kontekst, Povzetek modela, Zanimivosti, kakovost podatkov in korelacijske analize.
- Lokacija CABLEX opredeljena kot Cesta Ste Marie Aux Mines.
- Prekrški niso vključeni v indeks Utrip Tržiča, ker njihovo število odraža tudi intenzivnost nadzora.

## v1.4.1 · julij 2026
- Dodan enotni podatkovni model, ki povezuje promet, parkiranje, parkirnine, vreme, dogodke, zaposlene, prebivalce, turizem in EV.
- EasyPark in HECTRONIC sta vključena v vse scenarijske analize.
- Dodana sestavljena kazalnika Utrip Tržiča, kakovost podatkov in zanesljivost modela.
- Ocenjene prometne meritve so sistemsko označene in vplivajo na oceno kakovosti.
- Nadgrajen Povzetek modela z dejanskimi povezavami med prometom, zasedenostjo in parkirninami.

# Changelog

## Platforma v0.1
- dodana krovna vstopna stran;
- analitična aplikacija prenesena kot v0.62;
- vsi podatki analitične aplikacije pretvorjeni iz JSON/fetch v lokalne JavaScript datoteke;
- dodani pripravljeni mapi za javni prikaz in turizem;
- vse povezave so relativne.
