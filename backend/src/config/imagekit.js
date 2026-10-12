import ImageKit from '@imagekit/nodejs';
import { env } from './env.js';

let imagekitClient = null;

export function getImageKitClient() {
  if (env.isTest) return null;
  if (imagekitClient) return imagekitClient;
  if (
    env.imagekitPublicKey &&
    env.imagekitPrivateKey &&
    env.imagekitPrivateKey.startsWith('private_') &&
    env.imagekitUrlEndpoint
  ) {
    imagekitClient = new ImageKit({
      publicKey: env.imagekitPublicKey,
      privateKey: env.imagekitPrivateKey,
      urlEndpoint: env.imagekitUrlEndpoint,
    });
  }
  return imagekitClient;
}
