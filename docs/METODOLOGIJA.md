# Metodologija platforme Utrip Tržiča

**Izhodišče:** source package v2.0.1, presek 5. 8. 2026; obstoječa skupna metodologija je dopolnjena s pravili 2. razvojne faze.

## 1. Status podatkov

Vsaka vrednost mora biti označena kot:

- **izmerjeno/evidentirano** — neposreden zapis senzorja ali evidence;
- **izračunano** — rezultat znane formule;
- **ocenjeno/interpolirano** — nadomestitev omejene vrzeli ali modelna ocena;
- **scenarij** — hipotetična sprememba vhodne predpostavke;
- **napoved** — prihodnja vrednost, ki zahteva validacijo in napako napovedi;
- **manjka** — podatka ni in se ne nadomesti samodejno.

## 2. Prostorski in časovni obseg

Analiza mora vedno navesti lokacijo, območje, obdobje in časovno ločljivost. Podatka ene lokacije ni dovoljeno brez opozorila posplošiti na celotno občino.

CABLEX predstavlja eno merilno mesto na Cesti Ste Marie Aux Mines. Sedem parkirišč predstavlja samo spremljane lokacije. Ena EV polnilnica ne predstavlja vseh električnih vozil ali polnilnic. Turistične evidence predstavljajo prijavljene goste v nastanitvah in ne dnevnih obiskovalcev.

## 3. Manjkajoči podatki in interpolacija

Dnevni CABLEX podatki med 20. 5. in 22. 8. 2024 so sezonsko ocenjeni po primerljivih dneh sosednjih let ter označeni z `estimated: true`. Ocenjenih je 95 dni. Ocena se uporablja za neprekinjen prikaz in mesečne modele, vendar ni enakovredna meritvi.

Prazni PISO izvozi **Hitrost**, **Kolesarske poti** in **Cestne zapore** so označeni kot manjkajoč vir. Prazna tabela ne pomeni, da infrastrukture ali zapor ni.

## 4. Korelacija, regresija in scenariji

Korelacija opisuje sočasno spreminjanje, ne dokazuje vzročnosti. Regresija mora navesti obdobje, število opazovanj in R². Scenarij mora navesti izhodišče, spremenjeno predpostavko, razpon rezultata in omejitve. Predikcije se uvedejo šele po časovnem backtestingu.

## 5. Indeks Utrip Tržiča

Indeks je relativni sestavljeni kazalnik aktivnosti. Vrednost 100 pomeni običajno raven za primerljive koledarske mesece v razpoložljivem obdobju.

| Komponenta | Utež | Vhod |
|---|---:|---|
| Promet | 28 % | povprečni dnevni promet CABLEX |
| Parkiranje | 22 % | kapacitetno utežena zasedenost spremljanih parkirišč |
| Parkirnine | 20 % | aktivnost EasyPark in HECTRONIC |
| Dogodki | 10 % | aktivni koledarski dnevi dogodkov |
| Turizem | 10 % | evidentirani gostje |
| Vreme | 10 % | izpeljan kazalnik ugodja |

Dogodki ne pomenijo števila različnih prireditev, obiskanosti ali dokazanega vpliva. Če komponenta nima dovolj podatkov, se njena utež izloči in ostale se sorazmerno preračunajo.

## 6. PISO Desktop kot kontekstni vir

PISO Desktop omogoča izvoz atributnih podatkov prostorskih slojev. Pregledani izvozi BCP, BUS, pločniki, omejitve hitrosti in naselja vsebujejo identifikatorje odsekov, stacionaže, dolžine in tematske atribute, ne pa geometrije. Zato:

- izboljšujejo razlago prostorskega in infrastrukturnega ozadja;
- ne vstopajo v indeks, regresije, scenarijske uteži ali oceno zanesljivosti;
- niso samostojna karta in brez geometrije ne omogočajo prostorskega preseka;
- polja s kodami se ne interpretirajo brez uradnega šifranta;
- zapisi z zaključenim `DAT_KON` se obravnavajo kot zgodovinski;
- manjkajoči zapisi se ne razlagajo kot dokaz odsotnosti infrastrukture.

Za prihodnjo GIS analitiko so potrebni SHP/GPKG/GeoJSON, naveden koordinatni sistem, stabilni ID-ji, šifranti in datum veljavnosti.

## 7. Zanesljivost

Trenutne odstotne ocene kakovosti in zanesljivosti so opozorilni, deloma hevristični indikatorji. Naslednji metodološki korak je časovno navzkrižno preverjanje, merjenje MAE/RMSE/MAPE na neuporabljenih podatkih, intervali napovedi, stabilnost po letih ter občutljivost na manjkajoče vire.

## 8. Pravila AI razlag

Razlaga najprej pove, kaj podatki kažejo, nato zakaj je to pomembno in česa ni mogoče zaključiti. Pravna, strateška in prostorska dokumentacija je kontekst in omejitev modela, ne nadomestek za meritve.


## Posamezni prometni odseki — 2. razvojna faza

- Vsak odsek ima ločeno lokacijo, omejitev, smeri, obdobje in podatkovno datoteko; rezultat se ne posploši na celotno občino.
- Smer se potrdi s tehničnim opisom naprave ali neodvisnim kontrolnim izvozom. Ime datoteke ni zadosten dokaz.
- Primerljivi dnevni izračuni vključujejo samo dneve z vsemi pričakovanimi intervali v obeh smereh. Manjkajoči intervali se ne interpolirajo brez posebej dogovorjene metodologije.
- Povprečna hitrost daljšega obdobja je prometno utežena.
- P85 se iz intervalnih agregatov označi kot intervalna ocena; natančen P85 obdobja zahteva posamezne meritve vozil ali neposreden percentil nad celotnim obdobjem v Elasticu.
- Prekoračitve se prikažejo kot absolutno število, delež vseh vozil in povprečje na dan. Ne uporabljata se samo najvišja hitrost ali samo povprečje.
- Kategorije vozil se primerjajo po smereh in časovnih intervalih, vendar kategorija sama ne pojasni namena poti.
- Lokacijski kontekst vključuje stanovanjsko okolje, pešce, pločnike, priključke, postajališča, šole/vrtce, nesreče in prijave. Nepotrjena polja ostanejo označena kot manjkajoča.
- Pritožba je povod za objektivno preverjanje, ne dokaz problema. Meritve lahko podprejo nadaljnjo strokovno presojo ukrepov, ne pa samodejne odločitve za radar.

### Odsek Zvirče

- potrjeno: `direction 1 = proti Kranju`, `direction 0 = proti Tržiču`;
- pravilna preslikava temelji na 100-odstotnem ujemanju 2.194 intervalov in kontrolnih izvozih TC25;
- primerljivo obdobje vključuje samo 1.094 popolnih dni; pet nepopolnih oziroma manjkajočih dni je izločenih brez interpolacije;
- pri pragu 100 km/h je prikazana spodnja meja, ker izvorni stolpec ni število;
- lokacijski kontekst vključuje stanovanjsko naselje, pešce/pločnike, priključke in avtobusni postajališči, ne pa osnovne šole;
- prometne nesreče niso vključene in odločitev o radarju ni avtomatski rezultat.
