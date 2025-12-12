const tsNode = require('ts-node');

tsNode.register({
    project: './tsconfig.test.json',
    transpileOnly: true,
    experimentalResolver: true,
    compilerOptions: {
        module: 'commonjs'
    }
});
