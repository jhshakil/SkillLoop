import crypto from "crypto";

export const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
export const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "";

export function getImageKitAuthParams() {
  if (!IMAGEKIT_PRIVATE_KEY) {
    return { token: "", expire: 0, signature: "" };
  }

  const expire = Math.floor(Date.now() / 1000) + 60 * 30;
  const token = crypto.randomUUID();

  const signature = crypto
    .createHmac("sha1", IMAGEKIT_PRIVATE_KEY)
    .update(`${token}${expire}`)
    .digest("hex");

  return { token, expire, signature };
}

export async function deleteImageKitFile(imageUrl: string) {
  if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) return;
  if (!imageUrl.startsWith(IMAGEKIT_URL_ENDPOINT)) return;

  const encodedUrl = encodeURIComponent(imageUrl);
  const auth = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString("base64");

  const searchRes = await fetch(`https://api.imagekit.io/v1/files?url=${encodedUrl}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!searchRes.ok) return;

  const files = await searchRes.json();
  const fileId = files?.[0]?.fileId;
  if (!fileId) return;

  await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${auth}` },
  });
}
