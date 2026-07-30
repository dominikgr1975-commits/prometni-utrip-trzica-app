# Utrip Tržiča – platforma v1.8

Statična client-side platforma brez Reacta, strežniških skript, prijav ali API ključev.

## Zagon

Odprite `index.html`. Analitična aplikacija deluje tudi neposredno prek `file:///`, ker so podatki pretvorjeni iz JSON v lokalne JavaScript datoteke in ne uporablja `fetch()`.

Grafi uporabljajo Chart.js prek CDN. Če računalnik nima internetne povezave, ostale analize delujejo, grafi pa prikažejo opozorilo. Za popolnoma offline namestitev se lahko pozneje doda lokalna kopija Chart.js.

## Struktura

- `index.html` – krovna vstopna stran
- `assets/` – skupni CSS in logotip
- `apps/analitika/` – obstoječa analitična aplikacija v0.62
- `apps/javni-prikaz/` – pripravljena mapa za javno aplikacijo
- `apps/turizem/` – Turistični utrip Tržiča z lastnim CSS-om in lokalnimi podatkovnimi prikazi
- `apps/strategija-turizem/` – primerjava Strategije turizma 2024–2031 z dejanskimi podatki poročanja
- `docs/` – metodologija, podatkovni viri in spremembe

Vse povezave so relativne in niso vezane na GitHub Pages.


Posodobitev julij 2026: dodana označena interpolacija manjkajočih prometnih meritev ter razširjeni podatki EasyPark in HECTRONIC.


## v1.6

Dodani so prekrški po ulicah in mesecih, analize povezave s prometom ter natančna lokacija CABLEX na Cesti Ste Marie Aux Mines.


## Javna aplikacija v1.5

Mapa `apps/javni-prikaz/` vsebuje aplikacijo **Prometni utrip Tržiča** za občane. Deluje brez lokalnega spletnega strežnika; podatki se naložijo iz lokalnih JavaScript datotek.


## Turistični utrip v0.1

Mapa `apps/turizem/` vsebuje funkcionalno turistično aplikacijo. Deluje tudi brez internetne povezave, ker ne uporablja zunanje knjižnice za grafe. Podatki so ločeni v `tourism-summary.js`, `tourism-markets.js` in `tourism-accommodation.js`.


## Platforma v1.8

Dodana je samostojna aplikacija **Uresničevanje Strategije turizma 2024–2031 v0.1**. Prikazuje samo dejanske primerjave med strateškimi cilji in podatki turističnega poročanja za obdobje januar 2018–junij 2026. Za letne primerjave uporablja zadnje zaključeno leto 2025; leto 2026 je prikazano ločeno za januar–junij.
