/**
 * ServerService - Manages HTTP server for serving files.
 * Required for Puppeteer to access local files and images.
 * Also serves temporary Mermaid images from the system temp directory.
 */

import { createServer, type Server } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import serveHandler from 'serve-handler';
import { type IServerService } from '../interfaces/index.js';
import { type Config } from '../config.js';
import { MERMAID_CONSTANTS, IMAGE_CONSTANTS } from '../config/constants.js';

export class ServerService implements IServerService {
	private server: Server | undefined;
	private port: number | undefined;

	/**
	 * Start the HTTP server.
	 *
	 * @param config - Configuration with basedir and port
	 */
	public async start(config: Config): Promise<void> {
		if (this.server) {
			return;
		}

		this.port = config.port;
		const mermaidTempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);

		this.server = createServer(async (request, response) => {
			const url = request.url || '/';

			// Handle requests for temporary Mermaid images
			const temporaryUrlPath = `/${MERMAID_CONSTANTS.TEMP_URL_PATH}/`;
			if (url.startsWith(temporaryUrlPath)) {
				// Extract the filename from the URL
				const filename = url.replace(temporaryUrlPath, '');
				const filePath = join(mermaidTempDir, filename);

				try {
					// Check if file exists
					const stats = statSync(filePath);

					// Set appropriate headers
					response.writeHead(200, {
						'Content-Type': IMAGE_CONSTANTS.MIME_TYPE,
						'Content-Length': stats.size,
					});

					// Stream the file
					const fileStream = createReadStream(filePath);
					fileStream.pipe(response);
				} catch {
					// File not found or error reading file
					if (!response.headersSent) {
						response.writeHead(404, { 'Content-Type': 'text/plain' });
						response.end('Image not found');
					}
				}

				return;
			}

			// Serve from base directory for all other requests
			await serveHandler(request, response, {
				public: config.basedir,
			});
		});

		await new Promise<void>((resolve) => {
			if (!this.server) {
				resolve();
				return;
			}

			this.server.listen(this.port, () => {
				resolve();
			});
		});
	}

	/**
	 * Stop the HTTP server.
	 */
	public async stop(): Promise<void> {
		if (!this.server) {
			return;
		}

		const serverToClose = this.server;
		this.server = undefined;
		this.port = undefined;

		await new Promise<void>((resolve) => {
			let resolved = false;
			const doResolve = () => {
				if (!resolved) {
					resolved = true;
					resolve();
				}
			};

			// Close all connections first, then close server
			if (typeof serverToClose.closeAllConnections === 'function') {
				serverToClose.closeAllConnections();
			}
			
			serverToClose.close(() => {
				doResolve();
			});

			// Force close after timeout to prevent hanging
			setTimeout(() => {
				doResolve();
			}, 100);
		});
	}

	/**
	 * Get the current server port.
	 *
	 * @returns Port number or undefined if server not started
	 */
	public getPort(): number | undefined {
		return this.port;
	}
}
