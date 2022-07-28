const watch = process.argv.includes('--watch');

require('esbuild')
  .build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    outdir: '.',
    treeShaking: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    keepNames: true,
    splitting: true,
    format: 'esm',
    watch,
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
