import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'src');
const exts = new Set(['.svelte', '.ts', '.js', '.tsx', '.css', '.md']);

const replacements = [
	// text
	[/text-slate-(9|8|7)00\b/g, 'text-ink'],
	[/text-slate-(6|5)00\b/g, 'text-ink-2'],
	[/text-slate-(4|3)00\b/g, 'text-ink-muted'],

	// bg
	[/\bbg-(white|slate-50)\b/g, 'bg-surface-elevated'],
	[/\bbg-slate-(100|200)\b/g, 'bg-surface-muted'],

	// border
	[/\bborder-slate-(200|300)\b/g, 'border-line'],

	// ring
	[/\bring-(cyan|blue)-\d{3,4}\b/g, 'ring-ring'],

	// brand/danger
	[/\b(text|bg)-(cyan|sky|blue)-(3|4|5|6)00\b/g, '$1-brand'],
	[/\b(text|bg)-(red|rose|orange)-(6|7|8|9)00\b/g, '$1-accent-critical'],

	// fix missing alias
	[/\b(neon-cyan)\b/g, 'brand']
];

function walk(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(p, files);
		else if (exts.has(path.extname(entry.name))) files.push(p);
	}
	return files;
}

const files = walk(root);
for (const file of files) {
	let txt = fs.readFileSync(file, 'utf8');
	let out = txt;
	replacements.forEach(([re, to]) => {
		out = out.replace(re, to);
	});
	if (out !== txt) {
		fs.writeFileSync(file, out, 'utf8');
		console.log('updated:', path.relative(process.cwd(), file));
	}
}
