const subjectPalette = ['red','orange','yellow','green','teal','blue','indigo','purple','pink','gray','cyan','emerald','violet'];
const shades = ['400','500','600','700','900'];
const safelist = ['translate-y-full','transform','transition-transform','duration-300'];
for (const c of subjectPalette) for (const s of shades) safelist.push(`bg-${c}-${s}`);
for (const c of ['green','red','yellow','blue','gray','orange','purple']) for (const s of ['300','400','500']) safelist.push(`text-${c}-${s}`);
for (const c of ['gray','green','red','amber']) for (const s of ['500','600','700','800']) safelist.push(`border-${c}-${s}`);
safelist.push('bg-primary/10','bg-primary/20','text-primary','border-primary','bg-success/20','bg-surface','text-adaptive','text-adaptive-muted','text-white','fill-current','animate-spin');
/** Tailwind config: scan HTML + JS renderers, safelist dynamic classes. */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  safelist,
  theme: { extend: { colors: { primary: 'var(--color-primary)', success: 'var(--color-success)' } } },
  corePlugins: { preflight: false },
};
