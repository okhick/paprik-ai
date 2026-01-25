import { gunzipSync } from 'zlib';
import { PaprikaApiConfig, PaprikaApiError } from './types.js';

/**
 * Paprika API client with HTTP Basic Auth
 */
export class PaprikaClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: PaprikaApiConfig) {
    this.baseUrl = config.baseUrl || 'https://www.paprikaapp.com/api/v1';
    this.authHeader = this.createAuthHeader(config.email, config.password);
  }

  /**
   * Create HTTP Basic Auth header
   */
  private createAuthHeader(email: string, password: string): string {
    const credentials = Buffer.from(`${email}:${password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Make a GET request to the Paprika API
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
          'Accept-Encoding': 'gzip',
        },
      });

      if (!response.ok) {
        throw new PaprikaApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          await response.text()
        );
      }

      // Get the response as a buffer
      const buffer = await response.arrayBuffer();
      const data = Buffer.from(buffer);

      // Decompress gzipped response
      const decompressed = this.decompress(data);

      // Parse JSON
      return JSON.parse(decompressed) as T;
    } catch (error) {
      if (error instanceof PaprikaApiError) {
        throw error;
      }
      throw new PaprikaApiError(
        `Failed to fetch from API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Make a POST request to the Paprika API
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new PaprikaApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          await response.text()
        );
      }

      const buffer = await response.arrayBuffer();
      const responseData = Buffer.from(buffer);
      const decompressed = this.decompress(responseData);

      return JSON.parse(decompressed) as T;
    } catch (error) {
      if (error instanceof PaprikaApiError) {
        throw error;
      }
      throw new PaprikaApiError(
        `Failed to post to API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Make a DELETE request to the Paprika API
   */
  async delete(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: this.authHeader,
        },
      });

      if (!response.ok) {
        throw new PaprikaApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      if (error instanceof PaprikaApiError) {
        throw error;
      }
      throw new PaprikaApiError(
        `Failed to delete from API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Decompress gzipped data
   */
  private decompress(data: Buffer): string {
    try {
      // Check if data is gzipped (starts with 0x1f8b)
      if (data[0] === 0x1f && data[1] === 0x8b) {
        const decompressed = gunzipSync(data);
        return decompressed.toString('utf-8');
      }
      // Not gzipped, return as-is
      return data.toString('utf-8');
    } catch (error) {
      throw new PaprikaApiError(
        `Failed to decompress response: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
