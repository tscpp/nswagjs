## NSwag.JS
<b>JavaScript API for [NSwag](https://github.com/RicoSuter/NSwag) - The Swagger/OpenAPI toolchain for .NET, ASP.NET Core and TypeScript.</b>

## Example

<details>
<summary><strong>JavaScript Import</strong></summary>
	
```javascript
const NSwag = require('nswagjs').NSwag

const nswag = new NSwag(NSwag.getCoreVersion())
```
</details>

**Importing NSwag**
```typescript
import NSwag from 'nswagjs'

const nswag = new NSwag('./node_modules/nswag', NSwag.getCoreVersion())
```

**Executing a .nswag configuration document by using the run method**
```typescript
// path to *.nswag or nswag.json file
await nswag.run(path.join(__dirname, 'main.nswag'), {
	input: {
		path: path.join(__dirname, 'main.openapi.json'), // same as url, can be undefined
		json: data // optional string, required if path/url is undefined
	},
	outputs: {
		// path to generated file
		'openApiToTypeScriptClient': path.join(__dirname, 'generated/run.test.ts')
	}
})
```

**Using openapi2tsclient generator**
```typescript
await nswag.openapi2tsclient(path.join(__dirname, 'main.openapi.json'), path.join(__dirname, 'generated/run.test.ts'))
```

## Useful tools

[@accility/protoc-swagger-plugin](https://www.npmjs.com/package/@accility/protoc-swagger-plugin) — Protocol Buffer to Swagger/OpenAPI plguin for [@accility/protoc-tools](https://www.npmjs.com/package/@accility/protoc-tools).

## Upcoming updates

 - Support for the openapi2csclient, .NET Swagger Generator, and JSON Schema Converters will be implemented in v2.0.

_Support for swagger generators is not going to be implemented due to the deprication._

## License
This project is licensed under [MIT](./LICENSE).
