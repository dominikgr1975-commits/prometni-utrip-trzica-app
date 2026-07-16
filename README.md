# Prometni utrip Tržiča v0.5

Demonstracijska spletna aplikacija za pregled in scenarijsko analizo prometa, parkirišč, vremena, zaposlenih in prebivalstva.

## Novosti v0.5

- možnost **VSA PARKIRIŠČA** v vseh parkirnih scenarijih;
- kapacitetno utežen skupni rezultat in tabela vseh parkirišč;
- triletni tedenski promet CABLEX in triletno povprečje hitrosti;
- večfaktorski vremenski model: sezona, promet, delovni dnevi, vikendi in prazniki;
- izboljšana scenarija zaposlenih in prebivalcev z razponi ter jasnimi predpostavkami;
- razdelek **Zakaj je rezultat tak?** pri vsaki analizi;
- poskusni vnos vprašanja v navadnem jeziku brez zunanjega AI API-ja;
- slovensko oblikovanje števil (npr. 8.354).

## Objavljanje

Aplikacija je statična. Vsebino mape naloži v koren GitHub brancha in v Settings → Pages izberi ta branch ter `/ (root)`.

Po objavi uporabi `Ctrl + F5`, ker brskalnik lahko hrani stare `app.js` in `styles.css`.

## Pomembna omejitev

Vgrajeno »pametno vprašanje« uporablja lokalno prepoznavanje pripravljenih vrst vprašanj. Pravi ChatGPT-podoben pogovor zahteva varen backend ali serverless funkcijo, ker API ključa ni varno shraniti v javni GitHub Pages kodi.
