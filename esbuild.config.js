const isDev = process.argv.includes('--watch');

require('esbuild')
  .build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    outdir: '.',
    treeShaking: true,
    minifyIdentifiers: false,
    minifySyntax: !isDev,
    minifyWhitespace: !isDev,
    keepNames: true,
    splitting: true,
    format: 'esm',
    watch: isDev,
    target: isDev ? 'es2022' : 'es2015',
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
