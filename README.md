# ACSV (Auto Comma-Separated Values)

![ACSV Logo](src/ascv-logo-walter-modern-techno-sci-fi-typeface.png "ACSV Logo")

## About

ACSV (Auto Comma-Separated Values) is a superset of CSV that allows for automatic population of cells in your data. It's designed to make data generation and manipulation more efficient, especially for large datasets or when working with repetitive patterns.

Key features:
- Fully compatible with standard CSV
- Automatic cell population using simple operators
- Support for incremental and decremental values
- Easy-to-use syntax for data manipulation

## Demo

Try out ACSV in our online editor: [ACSV Editor Demo](https://acsv.vercel.app/)

## Installation

Clone locally for now (not yet published to npm):
```bash
git clone <this_repo_url>
cd acsv-transpiler
npm install
```

Build CLI and library outputs:
```bash
npm run build:cli   # → outputs CLI to cli/ACSVTranspiler.js
npm run build:lib   # → outputs library to dist/ACSVTranspiler.js
```

## CLI Usage

Transpile ACSV to CSV using the CLI:
```bash
node cli/ACSV.js path/to/input.acsv path/to/output.csv
```

## Library Usage

You can import the library in Node.js or ESM (after building):

```js
// test-acsv-usage.mjs (Node ESM, after npm run build:lib)
import transpile from './dist/ACSVTranspiler.js';

const input = `id,name

id++,name=John Doe
,,,
`;
const csv = transpile({ input, streaming: false, stats: false });
console.log(csv);
```

Also works in TypeScript:
```ts
import transpile from './dist/ACSVTranspiler.js';
```

## Development
- `npm run build:cli` — Builds CLI script in `cli/`
- `npm run build:lib` — Builds library to `dist/` (includes types)

## Usage

Here's a simple example of ACSV syntax:

```acsv
id,name,value

id++,name=John Doe,value=100
,,,
,,,

name=Jane Smith,value=200
,,,
,,,
```

This will generate:

```csv
id,name,value
1,John Doe,100
2,John Doe,100
3,John Doe,100
4,Jane Smith,200
5,Jane Smith,200
6,Jane Smith,200
```

## Contributing

We welcome contributions to ACSV! If you'd like to contribute, please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

ACSV was created by Christopher Shelley.

## Support

If you encounter any issues or have questions, please file an issue on our [GitHub issue tracker](https://github.com/made-by-chris/acsv/issues).