/// <reference types="mocha" />

import NSwag from '../src'
import * as path from 'path'
import * as fs from 'fs'
import * as assert from 'assert'

process.stdout.write('\x1b[4mInclude this in your pull request:\x1b[0m')

if (!fs.existsSync(path.join(__dirname, 'generated')))
	fs.mkdirSync(path.join(__dirname, 'generated'))

for (const dir of fs.readdirSync(path.join(__dirname, 'generated'))) {
	fs.unlinkSync(path.join(__dirname, 'generated', dir))
}

let coreVersion: NSwag.Core | undefined

describe('static', () => {
	describe('getCoreVersion()', () => {
		it('should return a usable core version', () => {
			coreVersion = NSwag.getCoreVersion()
			assert.strictEqual(typeof coreVersion, 'string', 'NSwag.getCoreVersion() did not return a usable core version. Do you have .NET installed?')
		})
	})
})

describe('run()', () => {
	it('should generate client files', async () => {
		const nswag = new NSwag(coreVersion ??= NSwag.getCoreVersion() ?? 'NetCore 2.1')

		await nswag.run(path.join(__dirname, 'resources/main.nswag'), {
			input: {
				path: path.join(__dirname, 'resources/main.openapi.json')
			},
			outputs: {
				'openApiToTypeScriptClient': path.join(__dirname, 'generated/run.test.ts')
			}
		})

		assert.strictEqual(fs.existsSync(path.join(__dirname, 'generated/run.test.ts')), true, 'All client files was not succesfully created.')
	})

	it('should download openapi/swagger from a url', async () => {
		const nswag = new NSwag(coreVersion ??= NSwag.getCoreVersion() ?? 'NetCore 2.1')

		await nswag.run(path.join(__dirname, 'resources/main.nswag'), {
			input: {
				url: 'http://redocly.github.io/redoc/openapi.yaml'
			},
			outputs: {
				'openApiToTypeScriptClient': path.join(__dirname, 'generated/url.test.ts')
			}
		})

		assert.strictEqual(fs.existsSync(path.join(__dirname, 'generated/url.test.ts')), true, 'All client files was not succesfully created.')
	})
})

describe('openapi2tsclient()', () => {
	it('should generate a TypeScript client file', async () => {
		const nswag = new NSwag(coreVersion ??= NSwag.getCoreVersion() ?? 'NetCore 2.1')

		await nswag.openapi2tsclient(path.join(__dirname, 'resources/main.nswag'), path.join(__dirname, 'generated/tsclient.test.ts'))

		assert.strictEqual(fs.existsSync(path.join(__dirname, 'generated/tsclient.test.ts')), true, 'All client files was not succesfully created.')
	})
})