# Utrip Tržiča – platforma v1.5

Statična client-side platforma brez Reacta, strežniških skript, prijav ali API ključev.

## Zagon

Odprite `index.html`. Analitična aplikacija deluje tudi neposredno prek `file:///`, ker so podatki pretvorjeni iz JSON v lokalne JavaScript datoteke in ne uporablja `fetch()`.

Grafi uporabljajo Chart.js prek CDN. Če računalnik nima internetne povezave, ostale analize delujejo, grafi pa prikažejo opozorilo. Za popolnoma offline namestitev se lahko pozneje doda lokalna kopija Chart.js.

## Struktura

- `index.html` – krovna vstopna stran
- `assets/` – skupni CSS in logotip
- `apps/analitika/` – obstoječa analitična aplikacija v0.62
- `apps/javni-prikaz/` – pripravljena mapa za javno aplikacijo
- `apps/turizem/` – pripravljena mapa za turistično aplikacijo
- `docs/` – metodologija, podatkovni viri in spremembe

Vse povezave so relativne in niso vezane na GitHub Pages.


Posodobitev julij 2026: dodana označena interpolacija manjkajočih prometnih meritev ter razširjeni podatki EasyPark in HECTRONIC.


## v1.5

Dodani so prekrški po ulicah in mesecih, analize povezave s prometom ter natančna lokacija CABLEX na Cesti Ste Marie Aux Mines.


## Javna aplikacija v1.5

Mapa `apps/javni-prikaz/` vsebuje aplikacijo **Prometni utrip Tržiča** za občane. Deluje brez lokalnega spletnega strežnika; podatki se naložijo iz lokalnih JavaScript datotek.
