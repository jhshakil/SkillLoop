export const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
export const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || "";
export const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "";

export function getImageKitAuthParams() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
  if (!privateKey) {
    return { token: "", expire: 0, signature: "" };
  }
  return { token: "", expire: 0, signature: "" };
}
