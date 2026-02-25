# Branding Guidelines

## Core Identity
**Skill-Tango** is the modern antidote to boring, static online courses. It should feel less like a school textbook and more like unlocking a tech-tree in a satisfying video game.

### Vibe Keywords
- **Cybernetic, Sleek, Intelligent, Dynamic, Rewarding.**

## Color Palette

The project uses a Dark-Mode "Glassmorphism" aesthetic built on the following custom CSS variables.

### Primary Palette (The "Tango")
- \`--color-cyber-cyan: #06B6D4\` (Used for primary buttons, active states, AI highlights)
- \`--color-neon-emerald: #10B981\` (Used for success markers, high scores, completed lessons)
- \`--gradient-primary: linear-gradient(90deg, #06B6D4, #10B981)\` (Used for heavy emphasis, progress bars)

### Backgrounds & Cards
- \`--color-void-black: #0A0A0A\` (True black background to make colors pop)
- \`--color-deep-blue: #0A1128\` 
- \`--gradient-card: linear-gradient(135deg, #0A1128 0%, #0A0A0A 100%)\` (Used for all interactive containers)

### Neutrals
- \`--color-ice-white: #F8FAFC\` (Primary text)
- \`--color-smoke-gray: #94A3B8\` (Secondary text, inactive states, locked items)

## Typography
- **Headings**: \`Space Grotesk\` - Used for all titles, chapter names, and numbers. Gives an instantly modern, tech-forward feel.
- **Body Context**: \`Inter\` - highly legible for long-form lesson text reading.

## Interaction Design
- **Micro-animations**: Everything interactive should have a fast, snappy transition (\`--transition-fast\`).
- **Glow Effects**: Hovering over buttons uses a subtle box-shadow glow instead of solid background changes to maintain the glass aesthetic.
