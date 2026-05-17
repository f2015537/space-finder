import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { AuthService } from "./AuthService";
import type { SpaceEntry } from "../models/SpaceEntry";

const API_URL = import.meta.env.VITE_API_URL;
const PHOTOS_BUCKET = import.meta.env.VITE_PHOTOS_BUCKET;
const AWS_REGION = import.meta.env.VITE_AWS_REGION;

export class DataService {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public async getSpaces(): Promise<SpaceEntry[]> {
    const token = await this.authService.getIdToken();
    const response = await fetch(API_URL, {
      headers: { Authorization: token },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch spaces: ${response.status}`);
    }
    return response.json() as Promise<SpaceEntry[]>;
  }

  public async uploadPhoto(file: File): Promise<string> {
    const credentials = await this.authService.generateCredentials();
    const s3 = new S3Client({ region: AWS_REGION, credentials });
    const key = `${Date.now()}-${file.name}`;
    const body = await file.arrayBuffer();
    await s3.send(
      new PutObjectCommand({
        Bucket: PHOTOS_BUCKET,
        Key: key,
        Body: new Uint8Array(body),
        ContentType: file.type,
      }),
    );
    return `https://${PHOTOS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }

  public async createSpace(
    name: string,
    location: string,
    photoUrl?: string,
  ): Promise<string> {
    const token = await this.authService.getIdToken();
    const body: Record<string, string> = { name, location };
    if (photoUrl) body.photoUrl = photoUrl;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message ?? `Request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.id as string;
  }
}
