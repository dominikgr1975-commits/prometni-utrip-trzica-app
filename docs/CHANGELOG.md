# v1.8 · nova aplikacija za spremljanje Strategije turizma

- dodana samostojna aplikacija **Uresničevanje Strategije turizma 2024–2031 v0.1**;
- primerjava ciljev 90.000 nočitev in 4,0 dneva bivanja z dejanskim stanjem leta 2025;
- prikazana rast povprečnega števila ležišč in delež nočitev izven junija, julija in avgusta;
- leto 2026 je prikazano samo za januar–junij in primerjano z enakim obdobjem 2025;
- kvalitativni cilji brez kazalnika v poročanju so označeni kot nemerljivi;
- OPN UPB1 je naveden kot prostorski kontekst, ne kot dokaz izvedbe;
- vstopna platforma je posodobljena na v1.8.

# v1.6 · revizija prometnih podatkov

- dnevni CABLEX podatki po vrstah in smereh; direction 1 = V lokacijo, 0 = IZ lokacije
- enoletni 3-urni profil parkirišč in dnevna zasedenost
- revidirani EasyPark in HECTRONIC mesečni podatki, ločeni plačani in brezplačni zapisi
- posodobljeni KPI, modeli, metodologija in javni prikaz smeri
- Turistični utrip v0.1.1 ostaja nespremenjen

# v1.5

- Popravljena izbira obdobja v javni aplikaciji; možnosti se zdaj ustvarijo iz dejansko razpoložljivih let.
- Ob menjavi obdobja se osvežijo graf delavnikov/vikendov/praznikov, sestava vozil, povprečni dnevni promet in opis izbranega obdobja.
- Omejitev hitrosti na merilnem mestu CABLEX popravljena na 40 km/h.

# Spremembe

## v1.5 · julij 2026

- Dodana javna aplikacija **Prometni utrip Tržiča**.
- Dodan prikaz sezonske zasedenosti parkirišč.
- Dodan interaktivni dnevno-urni profil za vsako spremljano parkirišče.
- Dodane povprečne hitrosti CABLEX po kategorijah vozil.
- Dodana primerjava prometa med delavniki, vikendi in prazniki z izbiro obdobja.
- Dodan prikaz sestave vozil za izbrano obdobje.
- Merilno mesto CABLEX je navedeno kot Cesta Ste Marie Aux Mines.

## v1.5
- Utrip Tržiča je spremenjen v relativni indeks, kjer 100 pomeni običajno aktivnost primerljivega obdobja.
- Dodana je izbira obdobja: zadnji 3, 6 ali 12 mesecev, tekoče leto, celotno obdobje ali poljuben razpon mesecev.
- Indeks se preračuna za izbrano obdobje in prikaže ločene komponente prometa, parkiranja, parkirnin, dogodkov, turizma in vremena.
- Dodana je razumljiva razlaga pomena vrednosti in primerjava z običajnim sezonsko primerljivim stanjem.

## v1.5 · julij 2026

- Dodan podatkovni sklop prekrškov po mesecih in ulicah za obdobje 2019–2026.
- Dodana grafa mesečnega trenda in razporeditve prekrškov po ulicah.
- Prekrški vključeni v enotni podatkovni kontekst, Povzetek modela, Zanimivosti, kakovost podatkov in korelacijske analize.
- Lokacija CABLEX opredeljena kot Cesta Ste Marie Aux Mines.
- Prekrški niso vključeni v indeks Utrip Tržiča, ker njihovo število odraža tudi intenzivnost nadzora.

## v1.5 · julij 2026
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

## Turistični utrip · podatkovna priprava v0.2 · julij 2026

- Dodani mesečni podatki nastanitvenih zmogljivosti za obdobje 2018-01 do 2026-06.
- Dodani gostje, nočitve, razpoložljive posteljne noči, izračunana razpoložljiva ležišča in stopnja zasedenosti.
- Podatki so pripravljeni za scenarije spremembe števila ležišč za −100, −50, −20, +20, +50 ali +100.

## Turistični utrip v0.1 · julij 2026

- Nadomestna turistična stran je zamenjana s funkcionalno aplikacijo **Turistični utrip Tržiča**.
- Dodan je preprost uvodni pregled gostov, nočitev, povprečne dolžine bivanja, zasedenosti, razpoložljivih ležišč in turistične takse.
- Dodana je analiza turističnih trgov z največ nočitvami izven glavne poletne sezone.
- Dodana je analiza slovenskih gostov po mesecih.
- Dodan je kapacitetni scenarij spremembe števila ležišč za −100, −50, −20, +20, +50 in +100.
- Dodana je ločena podatkovna datoteka `tourism-summary.js`; podatki se ne pretvarjajo ponovno ob vsakem zagonu.
- Turistična aplikacija uporablja lasten CSS in lokalne prikaze brez zunanje knjižnice za grafe.
- Na vstopni strani je turistična aplikacija označena kot dostopna.
