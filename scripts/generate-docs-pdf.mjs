import { mdToPdf } from 'md-to-pdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const sprint1Css = `
  html { font-size: 11pt; }
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 13pt; font-weight: 700; margin: 0 0 0.75em 0; border-bottom: 1px solid #c8c8c8; padding-bottom: 0.35em; }
  h2 { font-size: 12pt; font-weight: 700; margin: 1.25em 0 0.5em 0; }
  h3 { font-size: 11pt; font-weight: 700; margin: 1em 0 0.4em 0; }
  p, li, td, th { font-size: 11pt; }
  table { font-size: 10.5pt; border-collapse: collapse; width: 100%; margin: 0.65em 0; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; }
  th { background: #ececec; font-weight: 700; }
  code { font-family: Consolas, monospace; font-size: 10pt; background: #f4f4f4; padding: 0.1em 0.35em; }
  pre { font-family: Consolas, monospace; font-size: 9.5pt; background: #f6f6f6; border: 1px solid #e0e0e0; padding: 0.65em; }
  strong { font-size: inherit; font-weight: 700; }
`;

const sprint2CssPath = path.join(root, 'docs-src/sprint2/pdf-theme.css');
const sprint2Css = fs.readFileSync(sprint2CssPath, 'utf8');

function syncSprint2Images() {
  const from = path.join(root, 'docs/sprint2/imagens');
  const to = path.join(root, 'docs-src/sprint2/imagens');
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const file of fs.readdirSync(from)) {
    if (/\.(png|jpe?g|gif|webp)$/i.test(file)) {
      fs.copyFileSync(path.join(from, file), path.join(to, file));
    }
  }
}

const mappings = [
  { src: 'docs-src/sprint1/BACKEND_REST.md', dest: 'docs/sprint1/BACKEND_REST.pdf', css: sprint1Css },
  { src: 'docs-src/sprint2/EVENTOS_MOM.md', dest: 'docs/sprint2/EVENTOS_MOM.pdf', css: sprint2Css },
  { src: 'docs-src/sprint2/RELATORIO_INTEGRACAO_MOM.md', dest: 'docs/sprint2/RELATORIO_INTEGRACAO_MOM.pdf', css: sprint2Css },
  { src: 'docs-src/sprint2/ENTREGA_SPRINT2.md', dest: 'docs/sprint2/ENTREGA_SPRINT2.pdf', css: sprint2Css },
];

const pdfOptions = {
  format: 'A4',
  margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
  printBackground: true,
};

/**
 * Converte ![alt](./imagens/arquivo.png) em <img> base64 para o Puppeteer embutir no PDF.
 * @param {string} markdown
 * @param {string} basedir
 */
function embedLocalImages(markdown, basedir) {
  return markdown.replace(
    /!\[([^\]]*)\]\((\.\/imagens\/[^)]+)\)/gi,
    (_match, alt, relPath) => {
      const imgPath = path.resolve(basedir, relPath);
      if (!fs.existsSync(imgPath)) {
        console.warn(`  Aviso: imagem não encontrada: ${imgPath}`);
        return `*[Imagem ausente: ${relPath}]*`;
      }
      const ext = path.extname(imgPath).slice(1).toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      const base64 = fs.readFileSync(imgPath).toString('base64');
      const safeAlt = alt.replace(/"/g, "'");
      return `<p><img src="data:image/${mime};base64,${base64}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;margin:0.5em 0;" /></p>`;
    },
  );
}

async function main() {
  const onlySprint2 = process.argv.includes('--sprint2');

  if (!onlySprint2 || mappings.some((m) => m.src.includes('sprint2'))) {
    syncSprint2Images();
  }

  for (const { src, dest, css } of mappings) {
    if (onlySprint2 && !src.includes('sprint2')) continue;

    const mdPath = path.join(root, src);
    const pdfPath = path.join(root, dest);
    const basedir = path.dirname(mdPath);

    if (!fs.existsSync(mdPath)) {
      console.error(`Fonte não encontrada: ${src}`);
      process.exit(1);
    }

    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });

    console.log(`Gerando ${dest}...`);

    let input = { path: mdPath };
    const raw = fs.readFileSync(mdPath, 'utf8');
    if (raw.includes('./imagens/')) {
      input = { content: embedLocalImages(raw, basedir) };
    }

    const pdf = await mdToPdf(
      input,
      {
        dest: pdfPath,
        basedir,
        pdf_options: pdfOptions,
        css,
        launch_options: {
          args: ['--allow-file-access-from-files', '--no-sandbox'],
        },
      },
    );

    if (!pdf) {
      console.error(`Falha: ${src}`);
      process.exit(1);
    }

    console.log('  OK');
  }

  console.log('\nPDFs atualizados.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
