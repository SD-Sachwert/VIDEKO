/**
 * KUECHEN-TINDER — Aufgabentypen und Kartenpool (reine Daten).
 *
 * Jede Karte gehoert zu genau einem Aufgabentyp und traegt ihre Loesung
 * selbst: `ja: true/false`. Die Angaben auf der Karte (Name, Fakten, Farben)
 * enthalten das Merkmal, das die Antwort eindeutig macht. Geschmacksfragen
 * (modern, Landhaus, stimmig) sind nur ueber benannte Merkmale entschieden:
 *
 *   modern    glatte Front, grifflos oder schlichter Stangen-/Leistengriff,
 *             keine Profile
 *   Landhaus  Rahmen- oder Kassettenfront, Profile/Kranz, Knopf oder Muschel,
 *             Spuelstein, Sprossen, Tellerbord
 *   Schwarz/Gold  schwarze Front UND Gold-/Messingakzent — beides
 *
 * `stufe`: 1 = klar, 2 = mittel, 3 = Grenzfall (ein Merkmal lockt in die
 * falsche Richtung, die Antwort bleibt eindeutig).
 * `warum`: ein Satz, der nach einer falschen Antwort erscheint.
 */

export const AUFGABEN_TYPEN = [
  { key: 'modern', titel: 'Nur moderne Küchen', ja: 'JA = moderne Küche', hinweis: 'Glatte Front · grifflos oder schlichter Griff' },
  { key: 'landhaus', titel: 'Nur Landhaus', ja: 'JA = Landhausküche', hinweis: 'Rahmen/Kassette · Profile · Knopf oder Muschel' },
  { key: 'schwarzgold', titel: 'Nur Schwarz/Gold', ja: 'JA = schwarze Front + Gold/Messing', hinweis: 'Beides muss stimmen' },
  { key: 'platte', titel: 'Was passt zu dieser Arbeitsplatte?', ja: 'JA = Platte und Nutzung passen', hinweis: 'Hitze · Wasser · Pflege' },
  { key: 'griff', titel: 'Welcher Griff gehört dazu?', ja: 'JA = Griff passt zur Küche', hinweis: 'Grifflos heißt: kein Griff' },
  { key: 'armatur', titel: 'Welche Armatur passt?', ja: 'JA = Armatur passt', hinweis: 'Stil · Warmwasser · Einbauort' },
  { key: 'fehler', titel: 'Finde den Planungsfehler', ja: 'JA = hier steckt ein Fehler', hinweis: 'NEIN = gut geplant' },
  { key: 'nicht', titel: 'Was gehört NICHT in diese Küche?', ja: 'JA = gehört nicht hinein', hinweis: 'NEIN = passt hinein' },
  { key: 'kombi', titel: 'Welche Kombination ist stimmig?', ja: 'JA = stimmig', hinweis: 'Front, Platte, Akzent: ein Stil' },
  { key: 'wissen', titel: 'Schnelle Frage: Stimmt das?', ja: 'JA = stimmt', hinweis: 'Küchenwissen' },
]

/** Linienbilder, die KuechenTinder.jsx als SVG kennt. */
export const BILDER = [
  'armatur', 'backofen', 'brett', 'frage', 'griff', 'grundriss', 'haube', 'kanne', 'kochfeld',
  'pfanne', 'platte', 'schrank', 'spuele', 'spueler', 'stecker', 'topf', 'zeile-glatt', 'zeile-kassette',
]

/* Farbfelder — nur Flaechen, keine Bilder. */
const F = {
  weiss: '#f2efe8',
  creme: '#e6dbc2',
  schwarz: '#141414',
  anthrazit: '#3b3d40',
  grau: '#8d8b86',
  sandgrau: '#bdb3a3',
  beton: '#9a968e',
  eiche: '#b98a55',
  nuss: '#6b4a32',
  salbei: '#98ad8e',
  nachtblau: '#1c2742',
  messing: '#b8913f',
  gold: '#d4af37',
  chrom: '#cfd4d9',
  edelstahl: '#a7abaf',
  kupfer: '#b87333',
  alu: '#b5b8bb',
  marmorSchwarz: '#262523',
  neon: '#39ff14',
}
const fb = (...paare) => paare.map(([t, f]) => ({ t, f }))

/* Kurzschreibweise: id, Stufe, Loesung, Name, Fakten, Warum, Zusatz. */
const c = (typ) => (id, stufe, ja, name, fakten, warum, zusatz = {}) => ({ id, typ, stufe, ja, name, fakten, warum, ...zusatz })

const mo = c('modern')
const la = c('landhaus')
const sg = c('schwarzgold')
const pl = c('platte')
const gr = c('griff')
const ar = c('armatur')
const fe = c('fehler')
const ni = c('nicht')
const ko = c('kombi')
const wi = c('wissen')

const GLATT = { bild: 'zeile-glatt' }
const KASSETTE = { bild: 'zeile-kassette' }

export const KARTEN = [
  /* 1 — Nur moderne Kuechen */
  mo('mod-01', 1, true, 'Grifflose Lackküche', ['Glatte Front, matt weiß', 'Griffmulde statt Griff'], 'Glatte Fronten ohne Griff und Profil sind klar modern.', { ...GLATT, farben: fb(['Front', F.weiss], ['Platte', F.anthrazit]) }),
  mo('mod-02', 1, true, 'Hochglanz-Zeile', ['Hochglanz grau, flächenbündig', 'Griffleiste aus Alu'], 'Hochglanz, flächenbündig und Griffleiste – typisch modern.', { ...GLATT, farben: fb(['Front', F.grau], ['Griff', F.alu]) }),
  mo('mod-03', 1, false, 'Kassettenküche', ['Kassettenfront mit Profil', 'Kranzleiste · Knopfgriffe'], 'Kassette, Kranz und Knöpfe sind Landhaus, nicht modern.', { ...KASSETTE, farben: fb(['Front', F.creme], ['Griff', F.messing]) }),
  mo('mod-04', 1, false, 'Bauernküche', ['Rahmenfront, cremeweiß', 'Keramik-Spülstein · Tellerbord'], 'Rahmenfront, Spülstein und Tellerbord gehören zum Landhausstil.', { ...KASSETTE, farben: fb(['Front', F.creme], ['Platte', F.eiche]) }),
  mo('mod-05', 1, true, 'Betonküche', ['Front in Beton-Optik, glatt', 'Push-to-open, kein Griff'], 'Glatte Beton-Optik ohne Griffe ist eindeutig modern.', { ...GLATT, farben: fb(['Front', F.beton], ['Platte', F.schwarz]) }),
  mo('mod-06', 2, true, 'Eichen-Zeile', ['Echtholzfurnier Eiche, glatt', 'Grifflos · flächenbündig'], 'Holz allein macht keinen Landhausstil – glatt und grifflos ist modern.', { ...GLATT, farben: fb(['Front', F.eiche], ['Platte', F.weiss]) }),
  mo('mod-07', 2, false, 'Sprossen-Vitrine', ['Glastüren mit Holzsprossen', 'Profilierte Rahmen'], 'Sprossen und Profilrahmen sind klassische Landhaus-Merkmale.', { ...KASSETTE, farben: fb(['Front', F.weiss], ['Holz', F.eiche]) }),
  mo('mod-08', 2, true, 'Schwarze Matt-Küche', ['Front schwarz matt, glatt', 'Griffleiste schwarz'], 'Schwarz, glatt und mit Griffleiste – modern.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Griff', F.schwarz]) }),
  mo('mod-09', 2, false, 'Weiße Kassettenküche', ['Weiß lackiert, Kassettenfront', 'Muschelgriffe'], 'Weiß ist neutral – Kassette und Muschelgriffe sind Landhaus.', { ...KASSETTE, farben: fb(['Front', F.weiss], ['Griff', F.chrom]) }),
  mo('mod-10', 3, true, 'Salbeigrüne Zeile', ['Salbeigrün matt, glatte Front', 'Schmale Stangengriffe'], 'Die Farbe täuscht: glatte Front mit Stangengriff ist modern.', { ...GLATT, farben: fb(['Front', F.salbei], ['Griff', F.edelstahl]) }),
  mo('mod-11', 3, false, 'Hochglanz-Kassette', ['Hochglanz weiß', 'Kassettenfront · Kranzleiste'], 'Trotz Hochglanz: Kassette und Kranzleiste sind Landhaus.', { ...KASSETTE, farben: fb(['Front', F.weiss], ['Platte', F.grau]) }),
  mo('mod-12', 3, false, 'Schwarze Rahmenküche', ['Schwarz matt, Rahmenfront', 'Kranzleiste · Knopfgriffe'], 'Die dunkle Farbe täuscht – Rahmen, Kranz und Knöpfe sind Landhaus.', { ...KASSETTE, farben: fb(['Front', F.schwarz], ['Griff', F.messing]) }),
  mo('mod-13', 3, true, 'Nussbaum-Insel', ['Nussbaum, glatte Fronten', 'Grifflos · Wangen ohne Profil'], 'Warmes Holz, aber glatt und grifflos – das ist modern.', { ...GLATT, farben: fb(['Front', F.nuss], ['Platte', F.weiss]) }),
  mo('mod-14', 2, false, 'Blaue Rahmenküche', ['Rahmenfront nachtblau', 'Kranzleiste · Bügelgriffe antik'], 'Rahmenfront, Kranz und Antikgriffe sind Landhaus-Merkmale.', { ...KASSETTE, farben: fb(['Front', F.nachtblau], ['Griff', F.kupfer]) }),

  /* 2 — Nur Landhaus */
  la('lan-01', 1, true, 'Kassettenküche Creme', ['Kassettenfront, cremeweiß', 'Kranzleiste · Knopfgriffe'], 'Kassette, Kranz und Knöpfe – klassisches Landhaus.', { ...KASSETTE, farben: fb(['Front', F.creme], ['Griff', F.messing]) }),
  la('lan-02', 1, true, 'Spülstein-Küche', ['Rahmenfront, Keramik-Spülstein', 'Bogenarmatur mit Kreuzgriffen'], 'Spülstein, Rahmenfront und Kreuzgriffe sind typisch Landhaus.', { ...KASSETTE, farben: fb(['Front', F.weiss], ['Platte', F.eiche]) }),
  la('lan-03', 1, false, 'Grifflose Hochglanz', ['Hochglanz weiß, flächenbündig', 'Griffmulde'], 'Flächenbündig und grifflos ist modern, nicht Landhaus.', { ...GLATT, farben: fb(['Front', F.weiss], ['Platte', F.grau]) }),
  la('lan-04', 1, false, 'Beton grifflos', ['Beton-Optik, glatte Front', 'Push-to-open'], 'Glatte Beton-Optik ohne Griffe ist modern.', { ...GLATT, farben: fb(['Front', F.beton], ['Platte', F.schwarz]) }),
  la('lan-05', 1, true, 'Vitrine mit Sprossen', ['Glastüren mit Sprossen', 'Profilrahmen · Tellerbord'], 'Sprossen, Profile und Tellerbord sind Landhaus-Merkmale.', { ...KASSETTE, farben: fb(['Front', F.creme], ['Holz', F.eiche]) }),
  la('lan-06', 2, true, 'Salbeigrüne Kassette', ['Kassettenfront, salbeigrün', 'Muschelgriffe Messing'], 'Kassette mit Muschelgriffen ist Landhaus – egal in welcher Farbe.', { ...KASSETTE, farben: fb(['Front', F.salbei], ['Griff', F.messing]) }),
  la('lan-07', 2, false, 'Eiche grifflos', ['Echtholz Eiche, glatte Front', 'Keine Griffe, keine Profile'], 'Holz allein reicht nicht – ohne Rahmen und Profile ist es modern.', { ...GLATT, farben: fb(['Front', F.eiche], ['Platte', F.weiss]) }),
  la('lan-08', 2, false, 'Schwarze Glattfront', ['Schwarz matt, glatte Front', 'Griffleiste'], 'Glatte Front mit Griffleiste ist modern.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Griff', F.schwarz]) }),
  la('lan-09', 2, true, 'Weiße Rahmenküche', ['Rahmenfront weiß', 'Kranzleiste · Tellerbord'], 'Rahmenfront, Kranz und Tellerbord machen sie zur Landhausküche.', { ...KASSETTE, farben: fb(['Front', F.weiss], ['Platte', F.eiche]) }),
  la('lan-10', 3, true, 'Schwarzes Landhaus', ['Rahmenfront, schwarz matt', 'Kranzleiste · Knopfgriffe'], 'Schwarz ist nur die Farbe – Rahmen, Kranz und Knöpfe sind Landhaus.', { ...KASSETTE, farben: fb(['Front', F.schwarz], ['Griff', F.messing]) }),
  la('lan-11', 3, false, 'Creme mit Holzplatte', ['Glatte Fronten, cremeweiß', 'Massivholzplatte · Griffleiste'], 'Creme und Holz täuschen – glatte Fronten mit Griffleiste sind modern.', { ...GLATT, farben: fb(['Front', F.creme], ['Platte', F.eiche]) }),
  la('lan-12', 3, true, 'Kassette in Hochglanz', ['Hochglanz weiß', 'Kassettenfront · Kranzleiste'], 'Hochglanz ändert nichts: Kassette und Kranz sind Landhaus.', { ...KASSETTE, farben: fb(['Front', F.weiss], ['Platte', F.grau]) }),
  la('lan-13', 3, false, 'Grüne Grifflose', ['Salbeigrün matt, glatt', 'Griffmulde · keine Profile'], 'Die Landhausfarbe täuscht – glatt mit Griffmulde ist modern.', { ...GLATT, farben: fb(['Front', F.salbei], ['Platte', F.eiche]) }),
  la('lan-14', 2, false, 'Stangengriff-Zeile', ['Glatte Front, sandgrau', 'Stangengriffe Edelstahl'], 'Glatte Front mit Stangengriff ist modern.', { ...GLATT, farben: fb(['Front', F.sandgrau], ['Griff', F.edelstahl]) }),

  /* 3 — Nur Schwarz/Gold */
  sg('sg-01', 1, true, 'Schwarz & Messing', ['Front schwarz matt', 'Griffe Messing gebürstet'], 'Schwarze Front und Messing – genau das Schwarz/Gold-Konzept.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.messing]) }),
  sg('sg-02', 1, false, 'Weiß & Chrom', ['Front weiß', 'Griffe Chrom'], 'Weder schwarze Front noch Gold.', { ...GLATT, farben: fb(['Front', F.weiss], ['Akzent', F.chrom]) }),
  sg('sg-03', 1, true, 'Goldene Armatur', ['Front schwarz glänzend', 'Armatur und Griffe gold'], 'Schwarze Front mit Gold – passt.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.gold]) }),
  sg('sg-04', 1, false, 'Eiche & Edelstahl', ['Front Eiche natur', 'Armatur Edelstahl'], 'Holzfront und Edelstahl haben mit Schwarz/Gold nichts zu tun.', { ...GLATT, farben: fb(['Front', F.eiche], ['Akzent', F.edelstahl]) }),
  sg('sg-05', 1, true, 'Marmor-Insel', ['Front schwarz · Platte Nero Marquina', 'Leuchte & Griffe Messing'], 'Schwarz, dunkler Marmor und Messing – klares Schwarz/Gold.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Platte', F.marmorSchwarz], ['Akzent', F.messing]) }),
  sg('sg-06', 2, false, 'Schwarz & Chrom', ['Front schwarz matt', 'Griffe Chrom glänzend'], 'Schwarz stimmt, aber Chrom ist Silber – kein Gold.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.chrom]) }),
  sg('sg-07', 2, false, 'Weiß & Gold', ['Front weiß matt', 'Griffe gold'], 'Gold stimmt, aber die Front ist weiß.', { ...GLATT, farben: fb(['Front', F.weiss], ['Akzent', F.gold]) }),
  sg('sg-08', 2, true, 'Schwarz grifflos', ['Front schwarz, grifflos', 'Griffmulde in Messing'], 'Auch grifflos: schwarze Front, Mulde in Messing – Schwarz/Gold.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.messing]) }),
  sg('sg-09', 2, false, 'Schwarz & Edelstahl', ['Front schwarz', 'Griffe & Armatur Edelstahl'], 'Edelstahl ist silbern – das Gold fehlt.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.edelstahl]) }),
  sg('sg-10', 3, false, 'Anthrazit & Messing', ['Front anthrazitgrau', 'Griffe Messing'], 'Messing passt, aber Anthrazit ist Grau, nicht Schwarz.', { ...GLATT, farben: fb(['Front', F.anthrazit], ['Akzent', F.messing]) }),
  sg('sg-11', 3, false, 'Schwarz & Kupfer', ['Front schwarz matt', 'Griffe Kupfer'], 'Kupfer ist rötlich – das ist kein Gold.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.kupfer]) }),
  sg('sg-12', 3, false, 'Nachtblau & Gold', ['Front nachtblau', 'Griffe gold'], 'Sehr dunkel, aber Blau – nicht Schwarz.', { ...GLATT, farben: fb(['Front', F.nachtblau], ['Akzent', F.gold]) }),
  sg('sg-13', 3, true, 'Hochglanz & Goldleiste', ['Front schwarz Hochglanz', 'Griffleiste goldfarben eloxiert'], 'Eloxiert oder massiv – goldfarben bleibt Gold.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.gold]) }),
  sg('sg-14', 2, true, 'Schwarze Rahmenfront', ['Rahmenfront schwarz', 'Knopfgriffe Messing'], 'Auch Landhaus kann Schwarz/Gold: schwarze Front, Messingknöpfe.', { ...KASSETTE, farben: fb(['Front', F.schwarz], ['Akzent', F.messing]) }),
  sg('sg-15', 3, true, 'Schwarz gebeizt', ['Eiche schwarz gebeizt', 'Armatur Messing gebürstet'], 'Schwarz gebeizt ist schwarz – Messing liefert das Gold.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Akzent', F.messing]) }),

  /* 4 — Was passt zu dieser Arbeitsplatte? */
  pl('pla-01', 1, true, 'Granit', ['+ heiße Töpfe direkt abstellen'], 'Granit ist hitzebeständig – heiße Töpfe sind kein Problem.', { bild: 'platte' }),
  pl('pla-02', 1, false, 'Schichtstoff', ['+ heiße Pfanne direkt abstellen'], 'Schichtstoff kann durch große Hitze Blasen werfen und verfärben.', { bild: 'platte' }),
  pl('pla-03', 1, true, 'Keramik', ['+ heiße Töpfe direkt abstellen'], 'Keramik ist gebrannt und verträgt hohe Hitze.', { bild: 'platte' }),
  pl('pla-04', 1, false, 'Massivholz Eiche', ['+ nie ölen, nur nass wischen'], 'Massivholz braucht regelmäßig Öl, sonst wird es fleckig und rissig.', { bild: 'brett' }),
  pl('pla-05', 1, true, 'Massivholz Eiche', ['+ regelmäßig nachölen'], 'Genau so bleibt Massivholz schön und geschützt.', { bild: 'brett' }),
  pl('pla-06', 2, true, 'Quarzkomposit', ['+ Unterbauspüle'], 'Quarzkomposit ist dicht und wasserfest – Unterbau geht.', { bild: 'platte' }),
  pl('pla-07', 2, false, 'Quarzkomposit', ['+ Topf direkt vom Herd abstellen'], 'Das Harz im Quarzkomposit verträgt keine große direkte Hitze.', { bild: 'platte' }),
  pl('pla-08', 3, false, 'Schichtstoff auf Spanplatte', ['+ Unterbauspüle'], 'Die offene Spanplattenkante am Ausschnitt quillt – hier gehört eine Einbauspüle hin.', { bild: 'platte' }),
  pl('pla-09', 2, true, 'Mineralwerkstoff', ['+ fugenlos eingeformtes Becken'], 'Mineralwerkstoff lässt sich fugenlos mit dem Becken verbinden.', { bild: 'spuele' }),
  pl('pla-10', 2, false, 'Marmor Carrara', ['+ Zitronensaft darf liegen bleiben'], 'Säure ätzt Marmor matt – Zitronensaft sofort abwischen.', { bild: 'platte' }),
  pl('pla-11', 3, true, 'Keramik 12 mm', ['+ Unterbauspüle'], 'Keramik ist wasserfest und dicht – Unterbau ist üblich.', { bild: 'spuele' }),
  pl('pla-12', 3, false, 'Mineralwerkstoff', ['+ heiße Pfanne direkt abstellen'], 'Mineralwerkstoff kann durch Hitze Risse und Flecken bekommen.', { bild: 'platte' }),
  pl('pla-13', 2, true, 'Edelstahl', ['+ heiße Töpfe abstellen'], 'Edelstahl verträgt Hitze – höchstens Kratzer bleiben.', { bild: 'platte' }),
  pl('pla-14', 3, true, 'Granit', ['+ Unterbauspüle'], 'Granit ist dicht und massiv – Unterbauspülen sind Standard.', { bild: 'spuele' }),
  pl('pla-15', 3, false, 'Massivholz geölt', ['+ Wasser über Nacht stehen lassen'], 'Stehendes Wasser dringt ins Holz – es quillt und wird fleckig.', { bild: 'brett' }),

  /* 5 — Welcher Griff gehoert dazu? */
  gr('gri-01', 1, true, 'Knopfgriff Messing', ['Küche: Landhaus, Kassettenfront'], 'Knopfgriffe in Messing sind klassisch für Kassettenfronten.', { bild: 'griff', farben: fb(['Front', F.creme], ['Griff', F.messing]) }),
  gr('gri-02', 1, false, 'Bügelgriff Edelstahl', ['Küche: grifflos mit Griffmulde'], 'Eine grifflose Küche mit Griffmulde bekommt keinen zusätzlichen Griff.', { bild: 'griff', farben: fb(['Front', F.weiss], ['Griff', F.edelstahl]) }),
  gr('gri-03', 1, true, 'Stangengriff Edelstahl', ['Küche: modern, glatte Front'], 'Schlichter Stangengriff an glatter Front – modern und stimmig.', { bild: 'griff', farben: fb(['Front', F.grau], ['Griff', F.edelstahl]) }),
  gr('gri-04', 1, false, 'Muschelgriff antik', ['Küche: Hochglanz, flächenbündig'], 'Antike Muschelgriffe gehören an Landhausfronten, nicht an Hochglanz.', { bild: 'griff', farben: fb(['Front', F.weiss], ['Griff', F.kupfer]) }),
  gr('gri-05', 1, true, 'Griffleiste Messing', ['Küche: Schwarz/Gold-Konzept'], 'Messing an schwarzer Front erfüllt das Gold-Konzept.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.messing]) }),
  gr('gri-06', 2, false, 'Griffleiste Chrom', ['Küche: Schwarz/Gold-Konzept'], 'Chrom bricht das Gold-Konzept – Messing oder Gold gehört dazu.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.chrom]) }),
  gr('gri-07', 2, true, 'Muschelgriff Messing', ['Küche: Landhaus, Rahmenfront'], 'Muschelgriffe sind typische Landhausgriffe.', { bild: 'griff', farben: fb(['Front', F.salbei], ['Griff', F.messing]) }),
  gr('gri-08', 2, false, 'Alu-Griffprofil', ['Küche: Landhaus, Kassettenfront'], 'Durchlaufende Griffprofile sind modern – Landhaus braucht Knopf oder Muschel.', { bild: 'griff', farben: fb(['Front', F.creme], ['Griff', F.alu]) }),
  gr('gri-09', 2, true, 'Ohne Griff · Push-to-open', ['Küche: glatt, flächenbündig'], 'Flächenbündige Fronten öffnen per Druck – ganz ohne Griff.', { bild: 'zeile-glatt', farben: fb(['Front', F.weiss]) }),
  gr('gri-10', 3, false, 'Knopfgriff Messing antik', ['Küche: schwarz, grifflos mit Griffmulde'], 'Messing passt zur Farbe – aber Griffmulde heißt: kein Griff.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.messing]) }),
  gr('gri-11', 2, true, 'Stangengriff schwarz', ['Küche: modern, schwarz matt'], 'Schlichter schwarzer Stangengriff passt zur modernen Matt-Front.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.schwarz]) }),
  gr('gri-12', 3, true, 'Knopfgriff schwarz', ['Küche: Landhaus, Rahmenfront schwarz'], 'Schwarze Knöpfe passen zur schwarzen Rahmenfront im Landhausstil.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.schwarz]) }),
  gr('gri-13', 3, false, 'Griffleiste Messing', ['Küche: Schwarz/Gold, grifflos mit Griffmulde'], 'Gold passt, aber Griffmulde heißt: kein aufgesetzter Griff.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.messing]) }),
  gr('gri-14', 1, false, 'Kunststoffknopf bunt', ['Küche: Schwarz/Gold, Marmorplatte'], 'Bunte Kunststoffknöpfe brechen das edle Schwarz/Gold-Konzept.', { bild: 'griff', farben: fb(['Front', F.schwarz], ['Griff', F.neon]) }),

  /* 6 — Welche Armatur passt? */
  ar('arm-01', 1, true, 'Einhebel Edelstahl', ['Küche: modern, grifflos'], 'Schlichte Einhebelarmatur passt zur modernen Küche.', { bild: 'armatur', farben: fb(['Front', F.weiss], ['Armatur', F.edelstahl]) }),
  ar('arm-02', 1, false, 'Kreuzgriff-Bogen antik', ['Küche: modern, Hochglanz grifflos'], 'Antike Kreuzgriffe gehören in die Landhausküche, nicht zu Hochglanz grifflos.', { bild: 'armatur', farben: fb(['Front', F.weiss], ['Armatur', F.kupfer]) }),
  ar('arm-03', 1, true, 'Kreuzgriff-Bogen Messing', ['Küche: Landhaus mit Spülstein'], 'Bogenauslauf mit Kreuzgriffen ist die klassische Landhausarmatur.', { bild: 'armatur', farben: fb(['Front', F.creme], ['Armatur', F.messing]) }),
  ar('arm-04', 1, true, 'Messing gebürstet', ['Küche: Schwarz/Gold'], 'Messingarmatur an schwarzer Küche – genau das Konzept.', { bild: 'armatur', farben: fb(['Front', F.schwarz], ['Armatur', F.messing]) }),
  ar('arm-05', 1, false, 'Chrom glänzend', ['Küche: Schwarz/Gold'], 'Chrom ist Silber und fällt aus dem Gold-Konzept.', { bild: 'armatur', farben: fb(['Front', F.schwarz], ['Armatur', F.chrom]) }),
  ar('arm-06', 2, false, 'Niederdruckarmatur', ['Warmwasser: zentral über die Heizung'], 'Niederdruckarmaturen gehören an offene Kleinspeicher, nicht an die Zentralversorgung.', { bild: 'armatur' }),
  ar('arm-07', 2, true, 'Niederdruckarmatur', ['Warmwasser: offener 5-l-Untertischspeicher'], 'Offene Kleinspeicher brauchen eine Niederdruckarmatur.', { bild: 'armatur' }),
  ar('arm-08', 2, false, 'Hochdruckarmatur', ['Warmwasser: offener 5-l-Untertischspeicher'], 'Am offenen Kleinspeicher muss eine Niederdruckarmatur sitzen.', { bild: 'armatur' }),
  ar('arm-09', 2, true, 'Vorfensterarmatur', ['Spüle unter Fenster, öffnet nach innen'], 'Vorfensterarmaturen lassen sich umlegen – das Fenster geht auf.', { bild: 'armatur' }),
  ar('arm-10', 2, false, 'Hohe Bogenarmatur, fest', ['Spüle unter Fenster, öffnet nach innen'], 'Eine feste hohe Armatur blockiert den Fensterflügel.', { bild: 'armatur' }),
  ar('arm-11', 3, false, 'Kochendwasserhahn', ['Unterschrank ohne Steckdose'], 'Der Boiler eines Kochendwasserhahns im Unterschrank braucht Strom.', { bild: 'armatur' }),
  ar('arm-12', 2, true, 'Kochendwasserhahn', ['Unterschrank mit Steckdose und Platz für den Boiler'], 'Strom und Platz für den Boiler sind da – passt.', { bild: 'armatur' }),
  ar('arm-13', 2, false, 'Armatur 45 cm hoch', ['Regalboden 38 cm über der Spüle'], 'Die Armatur ist höher als der Platz bis zum Regalboden.', { bild: 'armatur' }),
  ar('arm-14', 3, true, 'Hochdruckarmatur', ['Warmwasser: druckfester Durchlauferhitzer'], 'Druckfeste Geräte arbeiten mit normalen Hochdruckarmaturen.', { bild: 'armatur' }),
  ar('arm-15', 3, false, 'Kreuzgriff antik Messing', ['Küche: Schwarz/Gold, grifflos modern'], 'Messing stimmt, aber antike Kreuzgriffe passen nicht zur grifflosen Moderne.', { bild: 'armatur', farben: fb(['Front', F.schwarz], ['Armatur', F.messing]) }),

  /* 7 — Finde den Planungsfehler (JA = Fehler vorhanden) */
  fe('feh-01', 1, false, 'Spüle & Geschirrspüler', ['Geschirrspüler direkt neben der Spüle'], 'Direkt neben der Spüle ist richtig – kurze Wege, kurzer Anschluss.', { bild: 'grundriss' }),
  fe('feh-02', 1, true, 'Geschirrspüler weit weg', ['3 m von der Spüle, andere Raumseite'], 'Der Geschirrspüler gehört neben die Spüle – wegen Anschluss und Laufwegen.', { bild: 'grundriss' }),
  fe('feh-03', 1, true, 'Kochfeld am Hochschrank', ['Kochfeld direkt am Hochschrank, 0 cm'], 'Neben dem Kochfeld braucht es Abstellfläche – direkt am Hochschrank ist falsch.', { bild: 'kochfeld' }),
  fe('feh-04', 1, false, 'Kochfeld mit Platz', ['Links und rechts je 40 cm Arbeitsfläche'], 'Abstellfläche auf beiden Seiten – gut geplant.', { bild: 'kochfeld' }),
  fe('feh-05', 1, true, 'Gang 60 cm', ['Zwischen Insel und Zeile 60 cm'], '60 cm sind zu eng – geplant wird mit mindestens rund 90 cm.', { bild: 'grundriss' }),
  fe('feh-06', 1, false, 'Gang 120 cm', ['Zwischen Insel und Zeile 120 cm'], '120 cm lassen Türen, Auszüge und zwei Personen gut aneinander vorbei.', { bild: 'grundriss' }),
  fe('feh-07', 2, true, 'Haube zu schmal', ['60er-Haube über 90er-Kochfeld'], 'Die Haube sollte mindestens so breit sein wie das Kochfeld.', { bild: 'haube' }),
  fe('feh-08', 2, false, 'Haube breiter', ['90er-Haube über 80er-Kochfeld'], 'Etwas breiter als das Kochfeld ist ideal – der Dunst wird gut erfasst.', { bild: 'haube' }),
  fe('feh-09', 2, true, 'Kochfeld am Fenster', ['Kochfeld direkt unter dem Fenster'], 'Unter dem Fenster passt keine Haube, und Vorhang oder Fensterflügel sind im Weg.', { bild: 'grundriss' }),
  fe('feh-10', 2, true, 'Spüle am Kochfeld', ['Spüle und Kochfeld ohne Fläche dazwischen'], 'Zwischen Spüle und Kochfeld gehört die Hauptarbeitsfläche.', { bild: 'grundriss' }),
  fe('feh-11', 2, false, 'Arbeitsfläche 90 cm', ['Zwischen Spüle und Kochfeld 90 cm frei'], 'Genug Platz zum Schneiden und Vorbereiten – gut geplant.', { bild: 'grundriss' }),
  fe('feh-12', 3, true, 'Abluft & Kaminofen', ['Ablufthaube, Kaminofen im Raum', 'keine Sicherheitsschaltung'], 'Abluft erzeugt Unterdruck – mit Kaminofen nur mit Sicherheitsschaltung.', { bild: 'haube' }),
  fe('feh-13', 3, false, 'Umluft & Kaminofen', ['Umlufthaube, Kaminofen im Raum'], 'Umluft saugt keine Raumluft nach draußen – kein Unterdruck, kein Fehler.', { bild: 'haube' }),
  fe('feh-14', 3, true, 'Auszüge über Eck', ['Zwei Auszüge im Eck, keine Passleiste'], 'Ohne Passleiste stoßen Griffe und Fronten im Eck zusammen.', { bild: 'schrank' }),
  fe('feh-15', 2, false, 'Backofen hochgebaut', ['Backofen im Hochschrank auf Greifhöhe'], 'Hochgebaute Backöfen schonen den Rücken – gute Planung.', { bild: 'backofen' }),
  fe('feh-16', 2, true, 'Steckdose über Spüle', ['Steckdose direkt über dem Becken'], 'Direkt über dem Becken spritzt Wasser – die Steckdose gehört seitlich versetzt.', { bild: 'stecker' }),

  /* 8 — Was gehoert NICHT in diese Kueche? (JA = gehoert nicht hinein) */
  ni('nic-01', 1, true, 'Kranzleiste mit Profil', ['Küche: grifflos, Hochglanz weiß'], 'Profilierte Kranzleisten sind Landhaus – in der grifflosen Küche ein Fremdkörper.', { bild: 'zeile-kassette' }),
  ni('nic-02', 1, false, 'Griffmulde', ['Küche: grifflos, Hochglanz weiß'], 'Griffmulden gehören genau in die grifflose Küche.', { bild: 'zeile-glatt' }),
  ni('nic-03', 1, true, 'Chromarmatur', ['Küche: Schwarz/Gold'], 'Chrom ist Silber und passt nicht ins Gold-Konzept.', { bild: 'armatur', farben: fb(['Küche', F.schwarz], ['Teil', F.chrom]) }),
  ni('nic-04', 1, false, 'Messing-Knopfgriffe', ['Küche: Landhaus, Kassettenfront'], 'Messingknöpfe sind klassisch für Kassettenfronten.', { bild: 'griff', farben: fb(['Küche', F.creme], ['Teil', F.messing]) }),
  ni('nic-05', 1, true, 'Aluminiumpfanne', ['Küche: nur Induktion', 'Pfanne ohne Induktionsboden'], 'Aluminium ohne magnetischen Boden funktioniert auf Induktion nicht.', { bild: 'pfanne' }),
  ni('nic-06', 2, false, 'Gusseisen-Bräter', ['Küche: nur Induktion'], 'Gusseisen ist magnetisch und läuft auf Induktion bestens.', { bild: 'topf' }),
  ni('nic-07', 2, true, 'Keramik-Spülstein', ['Küche: grifflos, Beton-Optik'], 'Der Spülstein ist ein Landhaus-Element – zur Beton-Grifflosen passt er nicht.', { bild: 'spuele' }),
  ni('nic-08', 2, false, 'Platte Nero Marquina', ['Küche: Schwarz/Gold'], 'Schwarzer Marmor passt perfekt zu Schwarz und Gold.', { bild: 'platte', farben: fb(['Küche', F.schwarz], ['Teil', F.marmorSchwarz]) }),
  ni('nic-09', 2, true, 'Arbeitshöhe 100 cm, fest', ['Küche: für Rollstuhlnutzer'], 'Im Rollstuhl braucht es rund 80–85 cm und unterfahrbare Flächen.', { bild: 'platte' }),
  ni('nic-10', 2, false, 'Unterfahrbare Spüle', ['Küche: für Rollstuhlnutzer'], 'Unterfahrbare Spülen sind in der rollstuhlgerechten Küche Pflicht.', { bild: 'spuele' }),
  ni('nic-11', 3, true, 'Tellerbord mit Profil', ['Küche: schwarz matt, grifflos, Messing'], 'Schwarz/Gold passt – das profilierte Tellerbord ist aber Landhaus.', { bild: 'zeile-kassette', farben: fb(['Küche', F.schwarz], ['Akzent', F.messing]) }),
  ni('nic-12', 3, false, 'Massivholz-Arbeitsplatte', ['Küche: modern, grifflos, weiß'], 'Glatte Holzplatten sind in modernen Küchen üblich – kein Stilbruch.', { bild: 'brett', farben: fb(['Küche', F.weiss], ['Teil', F.eiche]) }),
  ni('nic-13', 3, false, 'Schwarze Knopfgriffe', ['Küche: Landhaus, Rahmenfront schwarz'], 'Knöpfe sind Landhaus – in Schwarz passend zur Front.', { bild: 'griff', farben: fb(['Küche', F.schwarz], ['Teil', F.schwarz]) }),
  ni('nic-14', 3, true, 'Kupferkessel', ['Küche: nur Induktion', 'Kessel ohne Stahlboden'], 'Reines Kupfer ist nicht magnetisch – auf Induktion bleibt er kalt.', { bild: 'kanne' }),
  ni('nic-15', 2, true, 'Griffleiste Alu', ['Küche: Landhaus, Kassette, Messingknöpfe'], 'Alu-Griffleisten sind modern – an der Kassettenfront stören sie.', { bild: 'griff', farben: fb(['Küche', F.creme], ['Teil', F.alu]) }),

  /* 9 — Welche Kombination ist stimmig? */
  ko('kom-01', 1, true, 'Schwarz · Marmor · Messing', ['Front schwarz matt', 'Platte schwarzer Marmor', 'Armatur Messing'], 'Schwarz, dunkler Marmor und Messing – ein klares Konzept.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Platte', F.marmorSchwarz], ['Akzent', F.messing]) }),
  ko('kom-02', 1, true, 'Creme · Eiche · Messing', ['Kassettenfront creme', 'Platte Eiche massiv', 'Knopfgriffe Messing'], 'Kassette, Eiche und Messingknöpfe – stimmiges Landhaus.', { ...KASSETTE, farben: fb(['Front', F.creme], ['Platte', F.eiche], ['Akzent', F.messing]) }),
  ko('kom-03', 1, false, 'Kassette · Neon · Alu', ['Kassettenfront creme', 'Plattenkante neongrün', 'Griffleiste Alu'], 'Neon und Alu-Leisten beißen sich mit der klassischen Kassettenfront.', { ...KASSETTE, farben: fb(['Front', F.creme], ['Kante', F.neon], ['Akzent', F.alu]) }),
  ko('kom-04', 1, true, 'Weiß · Beton · Edelstahl', ['Front weiß matt, grifflos', 'Platte Beton-Optik', 'Armatur Edelstahl'], 'Glatt, grifflos, Beton und Edelstahl – durchgehend modern.', { ...GLATT, farben: fb(['Front', F.weiss], ['Platte', F.beton], ['Akzent', F.edelstahl]) }),
  ko('kom-05', 1, false, 'Hochglanz · Spülstein · Kreuzgriff', ['Front Hochglanz grifflos', 'Keramik-Spülstein', 'Kreuzgriff-Armatur antik'], 'Grifflose Hochglanzfront und antike Landhaus-Details passen nicht zusammen.', { ...GLATT, farben: fb(['Front', F.weiss], ['Spüle', F.creme], ['Akzent', F.kupfer]) }),
  ko('kom-06', 2, true, 'Grifflos · Auto-Open-Spüler', ['Front grifflos, Push-to-open', 'Geschirrspüler mit Öffnungsautomatik'], 'Ohne Griff braucht der Geschirrspüler eine Öffnungshilfe – die ist da.', { bild: 'spueler' }),
  ko('kom-07', 2, false, 'Grifflos · Spüler ohne Öffnung', ['Front grifflos, keine Griffmulde', 'Geschirrspüler ohne Öffnungshilfe'], 'Ohne Griff, Mulde oder Öffnungshilfe bekommt man die Spülertür nicht auf.', { bild: 'spueler' }),
  ko('kom-08', 2, true, 'Kochinsel · Muldenlüfter', ['Kochfeld in der Insel', 'Muldenlüfter statt Haube'], 'Muldenlüfter sind für Kochinseln ohne Haube gemacht.', { bild: 'kochfeld' }),
  ko('kom-09', 2, false, 'Schwarz/Gold · Chrom', ['Front schwarz', 'Griffe Messing', 'Armatur Chrom glänzend'], 'Die Chromarmatur fällt aus dem Gold-Konzept.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Griff', F.messing], ['Armatur', F.chrom]) }),
  ko('kom-10', 2, false, 'Kassette · Griffmulde', ['Kassettenfront salbeigrün', 'Griffmulde statt Griff', 'Platte Eiche'], 'Griffmulden sind modern – zur Kassettenfront gehören Knöpfe oder Muscheln.', { ...KASSETTE, farben: fb(['Front', F.salbei], ['Platte', F.eiche]) }),
  ko('kom-11', 3, true, 'Salbei · Eiche · Stange', ['Front salbeigrün, glatt', 'Platte Eiche', 'Stangengriff schwarz'], 'Glatte grüne Front, Eiche und schlichter Griff – stimmig modern.', { ...GLATT, farben: fb(['Front', F.salbei], ['Platte', F.eiche], ['Griff', F.schwarz]) }),
  ko('kom-12', 3, false, 'Schwarz/Gold · Edelstahlhaube', ['Front schwarz, Griffe Messing', 'Platte Nero Marquina', 'Haube Edelstahl glänzend'], 'Die glänzende Edelstahlhaube bricht das Schwarz/Gold-Konzept.', { ...GLATT, farben: fb(['Front', F.schwarz], ['Griff', F.messing], ['Haube', F.edelstahl]) }),
  ko('kom-13', 3, true, 'Schwarz · Messing · Eiche', ['Rahmenfront schwarz', 'Knopfgriffe Messing', 'Platte Eiche'], 'Rahmenfront, Messingknöpfe und Eiche – stimmiges dunkles Landhaus.', { ...KASSETTE, farben: fb(['Front', F.schwarz], ['Griff', F.messing], ['Platte', F.eiche]) }),
  ko('kom-14', 2, false, 'Beton · Kranz · Muschel', ['Front Beton-Optik, glatt', 'Kranzleiste mit Profil', 'Muschelgriffe'], 'Beton-Optik ist modern – Kranzleiste und Muschelgriffe sind Landhaus.', { ...GLATT, farben: fb(['Front', F.beton], ['Griff', F.messing]) }),

  /* 10 — Schnelle Ja/Nein-Fragen */
  wi('wis-01', 1, true, 'Arbeitsplatten sind meist rund 60 cm tief.', [], 'Standard-Arbeitsplatten sind rund 60 cm tief.', { bild: 'frage' }),
  wi('wis-02', 1, true, 'Der Geschirrspüler gehört neben die Spüle.', [], 'Neben der Spüle: kurzer Wasseranschluss und kurze Wege.', { bild: 'frage' }),
  wi('wis-03', 1, false, 'Umlufthauben brauchen einen Mauerdurchbruch.', [], 'Umluft filtert und bläst in den Raum zurück – kein Loch nach draußen.', { bild: 'frage' }),
  wi('wis-04', 1, false, 'Alu-Töpfe ohne Magnetboden gehen auf Induktion.', [], 'Induktion braucht einen magnetischen Topfboden.', { bild: 'frage' }),
  wi('wis-05', 1, true, 'Granit ist ein Naturstein.', [], 'Granit kommt aus dem Steinbruch – ein Naturstein.', { bild: 'frage' }),
  wi('wis-06', 2, true, 'Ideal: Arbeitsplatte 10–15 cm unter dem Ellenbogen.', [], 'Diese Faustregel gilt für eine rückenschonende Arbeitshöhe.', { bild: 'frage' }),
  wi('wis-07', 2, false, 'Marmor verträgt Zitronensaft problemlos.', [], 'Säure ätzt Marmor – Zitronensaft hinterlässt matte Flecken.', { bild: 'frage' }),
  wi('wis-08', 2, true, 'Über Gas ist der Haubenabstand größer als über Elektro.', [], 'Üblich sind etwa 65 cm über Elektro und 75 cm über Gas.', { bild: 'frage' }),
  wi('wis-09', 2, false, 'Quarzkomposit ist ein Naturstein.', [], 'Quarzkomposit ist gepresster Quarz mit Harz – ein Kunststein.', { bild: 'frage' }),
  wi('wis-10', 2, true, 'Ein Muldenlüfter braucht Platz im Unterschrank.', [], 'Motor und Kanal sitzen unter dem Kochfeld im Unterschrank.', { bild: 'frage' }),
  wi('wis-11', 3, true, 'Die Sockelhöhe verändert die Arbeitshöhe.', [], 'Höherer Sockel, höhere Arbeitsplatte – so wird die Höhe angepasst.', { bild: 'frage' }),
  wi('wis-12', 3, false, 'Ablufthaube und Kaminofen gehen ohne Sicherung.', [], 'Abluft erzeugt Unterdruck – beim Kaminofen braucht es eine Sicherheitsschaltung.', { bild: 'frage' }),
  wi('wis-13', 3, false, 'Oberschränke hängen meist 30 cm über der Platte.', [], 'Üblich sind rund 50 bis 60 cm Abstand zur Arbeitsplatte.', { bild: 'frage' }),
  wi('wis-14', 1, false, 'Die übliche Arbeitshöhe liegt bei 70 cm.', [], 'Übliche Arbeitshöhen liegen um 90 cm.', { bild: 'frage' }),
  wi('wis-15', 3, true, 'Emaillierte Stahltöpfe funktionieren auf Induktion.', [], 'Unter der Emaille steckt magnetischer Stahl – Induktion geht.', { bild: 'frage' }),
  wi('wis-16', 2, false, 'Massivholzplatten muss man nie ölen.', [], 'Geölte Massivholzplatten brauchen regelmäßig neues Öl.', { bild: 'frage' }),
]
