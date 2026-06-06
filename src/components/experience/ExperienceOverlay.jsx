import ExperienceSection from './ExperienceSection.jsx'

/** The scrolling HTML layer above the 3D rooms — one section per room. */
export default function ExperienceOverlay() {
  return (
    <div className="xp__sections">
      <ExperienceSection
        id="xp-hero"
        align="left"
        eyebrow="VIDEKO Experience"
        lines={['Bereit für eine Küche,', 'die nicht normal ist?']}
        sub="Für Menschen mit Anspruch. Für Räume mit Seele. Für alle, die keine Küche von der Stange wollen."
        primary={{ label: 'Beratung buchen', to: '/beratung' }}
        secondary={{ label: 'Showreel ansehen', href: '#xp-why' }}
      />

      <ExperienceSection
        id="xp-why"
        align="right"
        eyebrow="Warum VIDEKO"
        lines={['Schluss mit', 'Küchenverkauf von 2008.']}
        sub="Kein Rabattgeschrei, kein Verkaufsdruck. Sondern ehrliche Planung für dein echtes Leben."
        compare={{
          left: { title: 'Möbelhaus', items: ['Rabattgeschrei', 'Verkaufsdruck', 'Standardlösung', 'Prospektküche'] },
          right: { title: 'VIDEKO', items: ['Ehrliche Planung', 'Beratung auf Augenhöhe', 'Individuelles Raumkonzept', 'Feste Ansprechpartner'] },
        }}
        primary={{ label: 'Den Unterschied erleben', to: '/ueber-uns' }}
      />

      <ExperienceSection
        id="xp-material"
        align="left"
        eyebrow="Materialwelt"
        lines={['Materialien,', 'die man fühlen will.']}
        sub="Naturstein, Metall, Bronze, Keramik, Holz und Glas – echte Oberflächen, präzise verarbeitet."
        primary={{ label: 'Materialien entdecken', to: '/materialien' }}
      />

      <ExperienceSection
        id="xp-planning"
        align="right"
        eyebrow="Planungskompetenz"
        lines={['Was du siehst: Küche.', 'Was wir sehen:', '184 Entscheidungen.']}
        sub="Licht, Geräte, Arbeitsplatte, Korpus, Fronten, Stauraum, Maß und Montage – alles greift ineinander."
        primary={{ label: 'Planung entdecken', to: '/planung' }}
      />

      <ExperienceSection
        id="xp-showroom"
        align="center"
        eyebrow="Eintauchen statt nur anschauen."
        lines={['Bereit für', 'deine Küche?']}
        sub="Unser Studio ist kein Möbelhaus. Es ist ein Erlebnisraum für Küchen, Materialien und gute Entscheidungen."
        primary={{ label: 'Beratung buchen', to: '/beratung' }}
        secondary={{ label: 'Showroom ansehen', href: '/showroom' }}
      />
    </div>
  )
}
