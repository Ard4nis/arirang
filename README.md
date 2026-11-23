# Arirang Træningsportal 🥋

Dansk, mobilvenlig træningsportal til taekwondo-elever.

## Funktioner

- Pensum og træningsindhold til 10.–1. kup
- Valg af bæltegrad og tilpassede træningsplaner på tværs af grader
- Teknikker, poomsae/hyung og teori
- Flashcards, quizzer og lyttequiz
- Oplæsning (TTS) på enheder med understøttede browserstemmer
- Relevante videoressourcer fra Kukkiwon og godkendt Tang Soo Do-kilde
- Elevprofiler og lokal lagring af fremskridt
- Eksport og import af data

## GitHub Pages

1. Åbn **Settings → Pages** i GitHub.
2. Vælg **Deploy from a branch**.
3. Vælg branch **main** og mappe **/(root)**.
4. Gem, og åbn `https://ard4nis.github.io/arirang/` når GitHub Pages har deployet.

Projektet er statisk: `index.html` indeholder HTML, CSS, JavaScript og pensumdata. Ingen npm-installation, backend eller build kræves.

`.nojekyll` deaktiverer Jekyll-behandling på GitHub Pages.

## Brug og datalagring

Fremskridt gemmes i den enkelte browsers localStorage. Der er ikke login, cloudsynkronisering eller serverdatabase. Brug eksport/import for at flytte eller sikkerhedskopiere data.

TTS er afhængig af browserens og enhedens stemmer; koreansk udtale bør kontrolleres. YouTube-videoer kræver internet, og visse videoer tillader ikke indlejring.

## Rettigheder

Arirangs elevmappe (02.06.2024) angiver kopieringsrestriktioner. Projektets ejer har oplyst, at der er indhentet samtykke til portalen. Instruktørens undervisning har altid forrang. Videoerne indlejres eller linkes som eksterne kilder; de kopieres ikke ind i dette repository.

## Træningsværktøjer (november 2026)

- **Teknikbibliotek:** Søg i stande, blokeringer, håndteknikker og spark. Filtrér på eget kup, eget kup inkl. tidligere eller alle kup.
- **Kombinationsbygger:** Sammensæt rækkefølger manuelt og gem dem pr. elevprofil. Markér efterfølgende kombinationer som gennemgået med træneren.
- **Træningsgenerator:** Foreslår tilfældige teknikøvelser eller vælger fra egne gemte kombinationer. Automatisk genererede forslag er **ikke** godkendte kamp- eller gradueringskombinationer.
- **TTS-stemmevælger:** Koreansk og dansk stemme kan vælges hver for sig, når browseren/enheden stiller dem til rådighed. Valgene gemmes lokalt. På Firefox kan tilgængelige stemmer afhænge af OS og stemmepakker.

Systemet gemmer fortsat elevprofiler og fremskridt lokalt i browseren. Kombinationsdata følger elevprofilen ved eksport/import.

### Et- og tre-skridtskamp i træningsgeneratoren

Generatoren kan lave enkelte forslag eller et komplet øvesæt ud fra det valgte kup. For 6. kup genereres henholdsvis 10 et-skridtsforslag (5 med spark, 3 med nedtagning) og 8 tre-skridtsforslag (4 med spark, 2 med nedtagning). Enkeltforslag indeholder et foreslået angreb, forsvar og modangreb; tre-skridtsforslag viser tre angrebs-/forsvarstrin. Nedtagninger får **ingen automatisk teknikvejledning** — de skal vælges og instrueres af træneren. Gemte forslag er uofficielle og kan markeres som gennemgået med træneren. Forslagene er kun til teknikøvelse uden partnerkontakt, indtil træneren har godkendt udførelsen.

## November 2026: Guidet træning og kvalitetssikring

- **Dagens træning:** Vælg 8, 15 eller 25 minutter. Træningen sammensættes fra elevens studieplan og markerede udfordringer, og kan genoptages senere samme dag. Gennemførelse markeres separat fra at beherske en teknik.
- **Gradueringsoversigt:** Samlet status for teknik, teori, poomse/hyung, skridtkamp, selvforsvar og kamp. Alle statusser er selvrapporterede; de er ikke officielle gradueringer.
- **Praktisk fremgang:** Ikke startet, Øvet, Kan selv, Gennemgået med træner. Sidstnævnte er elevens egen notering af en faktisk gennemgang, ikke fjern-godkendelse fra instruktøren.
- **Skridtkamp:** Generatoren genbruger basisangreb og blokeringer fra tidligere kup og foreslår forsvar i passende højde. Der laves aldrig automatisk instruktion til nedtagninger. Teknikskitserne skal vurderes af en instruktør, før de bruges med en partner.
- **Data:** Backup/import kontrollerer nu kup, element-id'er, video-id'er og fremskridt. Fejlbehæftede sikkerhedskopier bliver afvist uden at overskrive eksisterende profiler. Den fulde elevprofil, herunder træningshistorik og egne kombinationer, følger med en gyldig backup.
- **Firefox/TTS:** Lyttequiz kræver en tilgængelig koreansk eller dansk stemme. Svarmulighederne aktiveres først, når taleafspilningen faktisk starter. Brug tekstquiz som alternativ, hvis der ikke er lyd.

### Videokilder og præcision

Den oprindelige videodækning er udbygget med navngivne enkeltvideoer og samlinger fra Kukkiwons grundteknikker. Videoerne er primært fundet gennem offentlige undervisningslister fra:
- https://www.tigerstkd.org/p/vid.html
- https://trudelfamilytkd.blogspot.com/2023/05/

Grundteknikvideoerne er **referencesamlinger**, ikke videoer som isolerer netop den enkelte teknik. Nogle er genudgivet af tredjeparter og er markeret som sådan. De oprindelige Kukkiwon-forms- og WTSDF-hyung-referencer bevares, herunder Stefans bekræftede Pyong Cho Dan.

### Tests og vedligeholdelse

Portalen har en testpakke uden eksterne Node-afhængigheder, som køres ved push og pull requests:

```sh
node --test tests/*.test.js
```

GitHub Actions: [Validate portal](https://github.com/Ard4nis/arirang/actions/workflows/validate.yml).

Ingen kontooprettelse, tracker eller backend er nødvendig. Alle profiler og træningsdata ligger i lokal browserlagring og bør sikkerhedskopieres.
