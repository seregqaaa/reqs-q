require('esbuild')
  .build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    treeShaking: true,
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    keepNames: true,
    splitting: true,
    format: 'esm',
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
