# Word Puzzle Game

Een interactieve **woordpuzzel-game** waarin spelers letters moeten raden om verborgen woorden te onthullen. De game is geïnspireerd door spellen zoals _Lingo_, maar met eigen functionaliteiten en een moderne web-implementatie.

## Beschrijving

- Raad letters om thematische woorden te onthullen.
- Elke fout kost een leven – verlies al je levens en het spel is voorbij.
- **Persistentie**: de spelstatus wordt onthouden met cookies (inclusief cookie consent integratie).
- Inclusief **geluidseffecten** voor feedback en beleving.
- **Mobiel-vriendelijk**: volledig responsief ontwerp.
- **Random modes**: woorden worden willekeurig gegenereerd voor eindeloos spelplezier.
- 100% **gratis te spelen**, direct in de browser (geen installatie nodig).

## Features

- Nederlandse woordenlijst
- Inspiratie van _Lingo_
- Levenssysteem bij foute gokjes
- Cookie consent + local game state opslag
- Geluidseffecten
- Mobile responsiveness
- Random mode voor continue gameplay

## Technologieën

- **HTML5** – structuur van de game
- **CSS3** – styling en responsive design
- **JavaScript (vanilla)** – game logica, state management en interacties

## Bestandsstructuur

Een voorstel voor de file structuur:

```
word-puzzle-game/
│
├── index.html              # Hoofdpagina van de game
├── css/
│   └── style.css           # Algemene styling
├── js/
│   ├── game.js             # Kernlogica van de game (letters, levens, random woorden)
│   ├── ui.js               # UI-updates (DOM manipulatie, meldingen)
│   ├── storage.js          # Cookie/localStorage functies voor persistentie
│   └── sounds.js           # Geluidseffecten
├── assets/
│   ├── sounds/             # Audio bestanden
│   │   ├── correct.mp3
│   │   └── wrong.mp3
│   └── images/             # Eventuele afbeeldingen/icons
└── README.md               # Projectdocumentatie
```

## Installatie en gebruik

1. Clone dit project of download het als `.zip`.
2. Open `index.html` in je browser.
3. Start direct met spelen – geen extra installatie nodig.

## Toekomstige verbeteringen / suggesties

- Meertalige ondersteuning (bijv. Engels en Nederlands).
- Scorebord of highscore systeem.
- Extra thema’s (dark mode, kleurschema’s).
- Nieuwe spelvarianten (bijv. tijdsdruk-modus).

## Feedback

Als je suggesties hebt of een probleem tegenkomt, laat het ons weten!
We horen graag je feedback zodat we de game nog leuker en gebruiksvriendelijker kunnen maken.
