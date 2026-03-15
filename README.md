# Pi Day Apps 🥧

10 expériences interactives autour de π — construites pour le Pi Day (14 mars).

**Live** : https://appforpiday.vercel.app/
**Repo** : https://github.com/grandey-HA/pi-day-apps

---

## Stack

- **Vite 6** + **React 19** + **TypeScript** (strict)
- HTML5 Canvas pour toutes les animations
- Aucune lib de visualisation — tout dessiné à la main
- Dark theme neon, layout compact pour tenir sur écran 13"
- Deploy : Vercel (auto-deploy depuis `main`)

## Architecture

```
src/
├── App.tsx              # Shell : header fixe (50px) + tab bar (36px) + floating π
├── index.css            # Thème dark, fonts Space Mono / Space Grotesk
└── apps/
    ├── shared.tsx       # Composants réutilisables : AppLayout, Card, Stat, Btn, SliderRow, PiCompare
    ├── MonteCarlo.tsx
    ├── BuffonNeedles.tsx
    ├── BaselSeries.tsx
    ├── GaussianIntegral.tsx
    ├── ArchimedesPolygons.tsx
    ├── SqrtPi.tsx
    ├── KochFractal.tsx
    ├── PiCircles.tsx
    ├── DecimalHunt.tsx
    └── PiQuiz.tsx
```

## Les 10 apps

### 1. Monte Carlo 🎲 `#00e5ff`
Simulation de points aléatoires dans un carré. Ratio cercle/carré → π.
- Canvas : cercle + points colorés (inside = cyan, outside = rose)
- Histogramme de convergence en temps réel
- **Presets cible** : 10⁴ → 10⁵ → 10⁶ → 10⁷ → 10⁸ → **10⁹**
- **Vitesse** : 1k → 1M points/frame (slider)
- Points affichés plafonnés à 8 000 visuellement

### 2. Aiguilles de Buffon `#f472b6`
Aiguilles lancées aléatoirement sur un parquet → π via probabilité géométrique.
- Canvas 500×260
- Formule : π ≈ 2·L·n / (d·c)

### 3. Série de Basel ∑ `#8b5cf6`
Somme de 1/n² converge vers π²/6 (Euler, 1734).
- Calcul **incrémental par batch** (non-bloquant)
- **Presets cible** : 100 → 10³ → 10⁴ → 10⁵ → 10⁶ → 10⁷ → 10⁸ → **10⁹**
- **Vitesse** : 1k → 1M termes/frame
- Canvas 580×200 : barres 1/n² (120 premiers) + ligne cumulative + point Σ total

### 4. Intégrale Gaussienne `#34d399`
∫e^(-x²)dx = √π — l'aire sous la courbe de Gauss.
- Canvas 600×250

### 5. Polygones d'Archimède `#fbbf24`
Polygones réguliers inscrits/circonscrits convergent vers π.
- Canvas 320×320, slider n côtés

### 6. Racine Carrée √π `#f87171`
√π ≈ 1.7724538... — spirale animée + preuve géométrique.
- 2 canvas 240×240 (spirale + preuve)

### 7. Flocon de Koch ❄ `#a78bfa`
Périmètre infini, aire finie — π dans les cercles limitants.
- Canvas 420×370, itérations 0→6

### 8. π dans les Cercles ○ `#2dd4bf`
Dessiner des cercles au canvas → mesure C/D = π en temps réel.
- Canvas 560×320, draw par drag

### 9. Chasse aux Décimales ⌨ `#fb923c`
Mémoriser et taper les 200 premières décimales de π.
- Mode clavier (touches physiques + virtuel) + mode roulette animée

### 10. Quiz π Interactif 🏆 `#e879f9`
10 questions (décimales, formules, culture π) avec timer 15s, vies, score.

---

## Composants partagés (`shared.tsx`)

| Composant | Description |
|-----------|-------------|
| `AppLayout` | Wrapper avec titre, icône, sous-titre coloré. Padding compact : `10px 16px 14px` |
| `Card` | Conteneur glassmorphism. Padding 12, borderRadius 12 |
| `Stat` | Petite stat colorée. Padding `7px 11px`, value fontSize 15 |
| `Btn` | Bouton compact. Padding `7px 14px`, fontSize 12 |
| `SliderRow` | Label + input range + valeur formatée |
| `PiCompare` | Barre de comparaison estimation vs π réel, digits corrects colorés |

---

## Développement

```bash
npm install
npm run dev        # localhost:5173
npm run build      # → dist/
```

## Deploy

Push sur `main` → Vercel rebuild automatique (~1-2 min).

```bash
git add .
git commit -m "feat: ..."
git push
```

---

## Choix techniques

- **Calcul incrémental** (Monte Carlo, Basel) : boucle par batch dans `requestAnimationFrame` pour ne pas bloquer le navigateur sur 10⁹ opérations
- **Canvas sizing** : toutes les tailles choisies pour tenir dans ~730px de hauteur utile (900px viewport − 86px header/tabs − marges)
- **base: '/'** dans `vite.config.ts` (requis pour Vercel — pas `'./'` qui est pour GitHub Pages)
