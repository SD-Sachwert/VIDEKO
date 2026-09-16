/**
 * Die Gewinne der Bierdeckel-Aktion — Texte und Motive.
 *
 * Bewusst getrennt von terminal.js: dort liegen die Kampagnenwerte, die auch
 * die Serverless-Funktionen lesen, und die laufen in Node ohne Vite. Ein
 * Bildimport waere dort ein harter Fehler.
 *
 * In den Motiven steht keine Schrift. Titel und Zeile sind freie Texte und
 * jederzeit hier aenderbar, ohne dass ein Bild neu gebaut werden muss.
 *
 * Bewusst ohne Geldwerte: ein in die Seite geschriebener Betrag waere eine
 * Zusage, die nur die Teilnahmebedingungen machen duerfen.
 *
 * `gross: true` markiert die beiden Hauptgewinne. Daraus entsteht im Layout
 * die Aufteilung zwei grosse Karten oben, drei kleinere darunter.
 */
import bildWellness from '../assets/images/terminal/terminal-gewinn-wellness.webp'
import bildGutschein from '../assets/images/terminal/terminal-gewinn-gutschein.webp'
import bildShirt from '../assets/images/terminal/terminal-gewinn-shirt.webp'
import bildTasche from '../assets/images/terminal/terminal-gewinn-tasche.webp'
import bildSchuerze from '../assets/images/terminal/terminal-gewinn-schuerze.webp'

export const GEWINNE = [
  {
    key: 'wellness',
    titel: 'Wellness-Reise',
    zeile: 'Auszeit zu zweit',
    bild: bildWellness,
    alt: 'Wellness-Reise als Hauptgewinn',
    gross: true,
  },
  {
    key: 'gutschein',
    titel: 'Küchen-Gutschein',
    zeile: 'Anrechenbar auf deine Planung',
    bild: bildGutschein,
    alt: 'Küchen-Gutschein von VIDEKO',
    gross: true,
  },
  {
    key: 'shirt',
    titel: 'T-Shirt',
    zeile: 'VIDEKO Merch',
    bild: bildShirt,
    alt: 'T-Shirt aus der VIDEKO Merch-Linie',
  },
  {
    key: 'tasche',
    titel: 'Tote Bag',
    zeile: 'VIDEKO Merch',
    bild: bildTasche,
    alt: 'Stofftasche aus der VIDEKO Merch-Linie',
  },
  {
    key: 'schuerze',
    titel: 'Schürze',
    zeile: 'VIDEKO Merch',
    bild: bildSchuerze,
    alt: 'Schürze aus der VIDEKO Merch-Linie',
  },
]
