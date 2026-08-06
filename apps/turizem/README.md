# Turistični utrip Tržiča v0.4

**Stanje:** Source package v1.9.1; aplikacija v zaključku prve faze ostaja vsebinsko v0.4.

Samostojna statična aplikacija z lastnim `styles.css`. Deluje neposredno prek `file:///`, na GitHub Pages in na običajnem spletnem strežniku.

## Obstoječi turistični del

Ohranjeni so vsi prikazi in izračuni iz v0.1.1:

- uvodni KPI-ji gostov, nočitev, bivanja, zasedenosti, ležišč in turistične takse;
- mesečni pregled gostov in nočitev;
- trgi z največ nočitvami zunaj glavne poletne sezone;
- mesečni profil slovenskih gostov;
- konservativni kapacitetni scenarij spremembe števila ležišč.

Turistični podatki zajemajo januar 2018–junij 2026. Podatki iz aplikacije obveznega poročanja o turističnih taksah ne zajemajo dnevnih gostov, ki se nikamor ne prijavljajo.

## Primerjava spletnega in turističnega obiska

Podrobni samostojni prikazi GA4 so v v0.4 odstranjeni. Ohranjen je samo osredotočen sklop, ki povezuje spletno zanimanje z dejanskimi turističnimi evidencami:

1. spletne seje po mesecih proti evidentiranim gostom in nočitvam;
2. spletne države proti dejanskim turističnim trgom;
3. časovni zamik spletnega zanimanja posameznega trga proti nočitvam (0–3 mesece);
4. vsebine, ki zanimajo posamezne države;
5. primerjava spletne sezonskosti s sezonskostjo gostov in nočitev.

## Trenutna podatkovna razpoložljivost

GA4 izvoz zajema 25. maj–24. julij 2026. Maj in julij sta delna meseca, junij 2026 pa je edini polni skupni mesec s turističnimi podatki.

Zato:

- mesečna in državna primerjava prikazujeta trenutno razpoložljiv opisni posnetek;
- časovnega zamika in sezonskosti še ni mogoče veljavno oceniti; funkcionalnost je pripravljena in se aktivira pri najmanj 12 polnih skupnih mesecih;
- vsebin po posameznih državah iz trenutnih CSV-jev ni mogoče določiti, ker sta dimenziji `Country` in `Page path` v ločenih izvozih. Potreben je dodatni izvoz z dimenzijami `Year`, `Month`, `Country`, `Page path` in `Page title`.

## Podatkovne datoteke

Normalizirani GA4 podatki:

- `data-js/visit-trzic-ga4.js`

Ohranjeni so vsi izvorni CSV-ji v:

- `data-source/google-analytics/`

Vsi podatki so agregirani in ne vsebujejo uporabniških ID-jev, Client ID-jev, IP-naslovov ali drugih osebnih podatkov.

## Spremembe v0.4

Spremenjene so samo datoteke znotraj `apps/turizem`:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Podatkovna datoteka GA4 in izvorni CSV-ji so ohranjeni. Druge aplikacije, vstopna stran, skupni CSS in prometni podatki niso bili spremenjeni.
