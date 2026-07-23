# Metodologija

Platforma združuje občinske in javne podatke v analize, statistične povezave in scenarijske ocene. Rezultati niso dokaz vzročnosti in ne nadomeščajo uradnih strokovnih študij.

Podatki niso v realnem času. Trenutna vsebina predstavlja presek razpoložljivega stanja na julij 2026.


## Interpolacija in ekstrapolacija

Manjkajoče oziroma očitno nepopolne meritve CABLEX med 20. 5. in 19. 8. 2024 so zapolnjene s sezonsko interpolacijo po primerljivih tednih drugih razpoložljivih let. V podatkih so označene z `estimated: true`. Interpolacija se lahko uporabi tudi drugje, kadar je vrzel omejena in okoliški podatki ne kažejo strukturnega preloma. Ne uporablja se za prikrivanje dolgih ali vsebinsko neprimerljivih vrzeli.

Ekstrapolacija je uporabljena v scenarijih in sliderjih. Rezultat je razpon možnega učinka ob predpostavki, da zgodovinska razmerja približno ostanejo veljavna. Ni nadomestilo za dejansko meritev ali uradno napoved.


## Enotni podatkovni model v1.5
Model mesečno povezuje promet CABLEX, zasedenost parkirišč, transakcije HECTRONIC, prihodke EasyPark, vreme, koledarske dejavnike, zaposlene, prebivalce in turizem. Vsaka vrednost se obravnava kot izmerjena, ocenjena ali manjkajoča.

Indeks **Utrip Tržiča (0–100)** je sestavljen orientacijski kazalnik: promet 28 %, zasedenost 22 %, parkirnine 20 %, dogodki 10 %, turizem 10 % in vreme 10 %. Namenjen je primerjavi obdobij, ne uradnemu statističnemu poročanju.

Ocena kakovosti podatkov temelji na pokritosti ključnih mesečnih polj, deležu dejanskih meritev in svežini. Zanesljivost modela dodatno upošteva kakovost večfaktorskega modela.


## Prekrški v1.5

Prekrški so vključeni kot ločena analitična dimenzija po mesecih in ulicah. Primerjajo se s prometom CABLEX, posebej za Cesto Ste Marie Aux Mines, vendar korelacija ni razložena kot vzročnost. Število evidentiranih prekrškov je odvisno tudi od obsega, lokacije in usmerjenosti nadzora, zato prekrški niso del indeksa Utrip Tržiča.

## Utrip Tržiča v1.5

Utrip Tržiča je relativni sestavljeni indeks aktivnosti. Vrednost **100** pomeni običajno raven aktivnosti za primerljive koledarske mesece v razpoložljivem zgodovinskem obdobju. Vrednost 115 pomeni približno 15 % višjo sestavljeno aktivnost, vrednost 85 pa približno 15 % nižjo.

Uporabnik lahko izbere zadnje 3, 6 ali 12 mesecev, tekoče leto, celotno obdobje ali poljuben razpon mesecev. Pri izračunu se upoštevajo promet, zasedenost parkirišč, parkirnine, dogodki, turizem in vreme. Če posamezen sklop za izbrano obdobje nima zadostnih podatkov, se njegova utež ne uporabi in se preostale uteži sorazmerno preračunajo.

Indeks ni uradni statistični kazalnik in ne meri kakovosti življenja, uspešnosti občine ali varnosti. Namenjen je primerjavi obdobij in hitremu razumevanju, ali je bilo izbrano obdobje bolj ali manj živahno od običajnega.

## Turistični utrip Tržiča v0.1

Turistična aplikacija uporablja tri ločene lokalne podatkovne sklope: osnovne mesečne kazalnike, razčlenitev po državah oziroma turističnih trgih ter nastanitvene zmogljivosti.

**Omejitev vira:** Podatki so iz aplikacije obveznega poročanja o turističnih taksah in žal ne zajemajo dnevnih gostov, ki se nikamor ne prijavljajo.

Glavna poletna sezona je za potrebe prve analize opredeljena kot junij, julij in avgust. Obdobje izven glavne poletne sezone je september–maj. Trgi se razvrstijo po številu nočitev izven glavne poletne sezone. Delež izven sezone pomeni delež nočitev posameznega trga, ki je nastal med septembrom in majem.

Pri analizi slovenskih gostov se za posamezno leto uporabijo dejanske mesečne vrednosti. Pri celotnem obdobju se izračuna povprečje posameznega koledarskega meseca po razpoložljivih letih, zato delno leto 2026 ne daje neupravičene prednosti mesecem januar–junij.

Scenarij spremembe števila ležišč je konservativen kapacitetni model. Povečanje števila ležišč samo po sebi ne poveča gostov ali nočitev, ampak zniža zasedenost. Pri zmanjšanju se gostje in nočitve zmanjšajo samo, če evidentirane nočitve presežejo novo razpoložljivo kapaciteto. Letna zasedenost je tehtani izračun: vsota nočitev deljeno z vsoto razpoložljivih posteljnih noči.

Izvorni zapis za Italijo novembra 2022 vsebuje negativno vrednost −136 nočitev. Zapis ostaja nespremenjen v podatkovni datoteki zaradi sledljivosti, pri agregiranih analizah pa je negativna vrednost izločena.
