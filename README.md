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

Arirangs elevmappe (02.06.2024) angiver kopieringsrestriktioner. Indhent klubbens tilladelse før offentlig distribution af bearbejdet pensummateriale. Trænerens instruktion har altid forrang.
