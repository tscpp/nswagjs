import * as fs from 'fs'
import * as child_process from 'child_process'
import * as path from 'path'

export class NSwag {
	private static _arch: Arch | undefined
	public static get arch(): Arch {
		return this._arch ??= process.arch as Arch
	}

	private static _platform: Platform | undefined
	public static get platform(): Platform {
		return this._platform ??= process.platform
	}

	public static getCoreVersion(): Core | undefined {
		let hasFullDotNet = false;
		if (process.env["windir"]) {
			try {
				const stats = fs.lstatSync(process.env["windir"] + '/Microsoft.NET')
				if (stats.isDirectory())
					hasFullDotNet = true
			}
			catch { }
		}

		if (NSwag.platform === 'win32' && hasFullDotNet) {
			if (NSwag.arch === 'x64')
				return 'Win x64'
			if (NSwag.arch === 'x32')
				return 'Win x86'
		} else {
			const version = /^\s*([0-9]+\.[0-9]+).+\s*$/.exec(child_process.execSync('dotnet --version').toString())?.[1]

			switch (version) {
				case '2.1': return 'NetCore 2.1'
				case '2.2': return 'NetCore 2.2'
				case '3.0': return 'NetCore 3.0'
				case '3.1': return 'NetCore 3.1'
			}
		}
	}

	public constructor(private core: Core) { }

	private get coreExecName() {
		switch (this.core) {
			case 'NetCore 2.1': return 'NetCore21/dotnet-nswag.dll'
			case 'NetCore 2.2': return 'NetCore22/dotnet-nswag.dll'
			case 'NetCore 3.0': return 'NetCore30/dotnet-nswag.dll'
			case 'NetCore 3.1': return 'NetCore31/dotnet-nswag.dll'
			case 'Win x64': return 'Win/NSwag.exe'
			case 'Win x86': return 'Win/NSwag.x86.exe'
		}
	}

	private coreExec = !fs.existsSync(path.join(__dirname, `../../node_modules/nswag/bin/binaries/${this.coreExecName}`)) ?
		path.join(__dirname, `../node_modules/nswag/bin/binaries/${this.coreExecName}`) :
		path.join(__dirname, `../../node_modules/nswag/bin/binaries/${this.coreExecName}`)

	public run(configFilePath: string, options: Options): Promise<string>
	public run(configFilePath: string, _options: Options) {
		const options = _options as _Options

		let url = options.input?.path ?? options.input?.url

		if (typeof configFilePath !== 'string')
			throw new Error(`Parameter configFilePath must be of type string.`)

		if (typeof options !== 'object')
			throw new Error(`Parameter options must be of type object.`)

		if (options.input && typeof options.input !== 'object')
			throw new Error(`Property input in parameter options must be of type string or unfined.`)

		if (url && typeof url !== 'string')
			throw new Error(`Property url/path in property input in parameter options must be of type string.`)

		if (options.input && options.input.json && typeof options.input.json !== 'string')
			throw new Error(`Property json in property input in parameter options must be of type string or undefined.`)

		if (!options.outputs || typeof options.outputs !== 'object')
			throw new Error(`Property outputs in parameter options must be of type object.`)

		if (url)
			url = url.replace(/\\/g, '/')

		for (const key in options.outputs) {
			if (Object.prototype.hasOwnProperty.call(options.outputs, key)) {
				if (typeof options.outputs[key] !== 'string')
					throw new Error(`All properties in property outputs in parameter options must be of type string.`)

				options.outputs[key] = options.outputs[key]?.replace(/\\/g, '/')
			}
		}

		if (!fs.existsSync(configFilePath))
			throw new Error(`Config file path '${configFilePath}' does not exist.`)

		const configRaw = fs.readFileSync(configFilePath).toString()

		let config: Config;

		try {
			config = JSON.parse(configRaw)
		} catch (err) {
			throw new Error('Unable to parse config.\n' + (typeof err === 'object' && 'toString' in err ? err.toString() : String(err)))
		}

		let json: string | undefined;

		if (options.input?.json) {
			try {
				void JSON.parse(options.input.json)
				json = options.input.json
			} catch { }

			if (!json)
				json = fs.readFileSync(options.input.json).toString()
		} else {
			try {
				if (url)
					json = fs.readFileSync(url).toString()
			} catch { }
		}

		if (json)
			config.documentGenerator.fromDocument.json = json

		config.documentGenerator.fromDocument.url = url ?? null

		for (const key in options.outputs) {
			if (Object.prototype.hasOwnProperty.call(options.outputs, key)) {
				if (!config.codeGenerators[key] || typeof config.codeGenerators[key] !== 'object')
					throw new Error(`Code generator ${key} does not exist.`)

				config.codeGenerators[key].output = options.outputs[key] ?? null
			}
		}

		fs.writeFileSync(configFilePath, JSON.stringify(config))

		return exec(this.coreExec, ['run', configFilePath.replace(/\\/g, '/')]).then(value => {
			fs.writeFileSync(configFilePath, configRaw)

			return value
		})
	}

	public openapi2tsclient(input: string, output: string) {
		input = input.replace(/\\/g, '/')
		output = output.replace(/\\/g, '/')
		return exec(this.coreExec, ['openapi2tsclient', `/input:${input}`, `/output:${output}`])
	}
}

export interface Options {
	input: { url: string, path?: string, json?: string },
	runtime?: Core,
	variables?: string,
	outputs: {
		[key: string]: string | undefined
		openApiToTypeScriptClient: string | undefined
	},
	configMod?: Config
}

interface _Options extends Options { }

export type Core = 'Win x64' | 'Win x86' | 'NetCore 2.1' | 'NetCore 2.2' | 'NetCore 3.0' | 'NetCore 3.1'
export type Arch = 'arm' | 'arm64' | 'ia32' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 's390' | 's390x' | 'x32' | 'x64'
export type Platform = NodeJS.Platform

export interface Config {
	[key: string]: unknown
	runtime: string,
	defaultVariables: string | null,
	documentGenerator: {
		fromDocument: {
			json: string | null,
			url: string | null,
			output: unknown,
			newLineBehavior: string
		}
	},
	codeGenerators: {
		[key: string]: {
			[key: string]: unknown
			output: string | null
		}
	}
}

interface _Config extends Config { }

export namespace NSwag {
	export type Core = 'Win x64' | 'Win x86' | 'NetCore 2.1' | 'NetCore 2.2' | 'NetCore 3.0' | 'NetCore 3.1'
	export type Arch = 'arm' | 'arm64' | 'ia32' | 'mips' | 'mipsel' | 'ppc' | 'ppc64' | 's390' | 's390x' | 'x32' | 'x64'
	export type Platform = NodeJS.Platform

	export interface Options extends _Options { }

	export interface Config extends _Config { }
}

function exec(file: string, args: string[]) {
	if (!fs.existsSync(file))
		throw new Error(`The path ${file} does not exist.`)

	const child = child_process.execFile(file, args, {
		cwd: __dirname
	})

	let data = ''
	child.stdout?.on('data', (_data: Buffer) => data += _data.toString())
	child.stderr?.pipe(process.stderr)

	return new Promise<string>(r => child.on('close', () => r(data)))
}

export default NSwag