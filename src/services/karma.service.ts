import { env } from "../config/env";
import { AppError } from "../utils/errors";

export class KarmaService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = env.ADJUTOR_BASE_URL;
    this.apiKey = env.ADJUTOR_API_KEY;
  }

  async isBlacklisted(bvn: string): Promise<boolean> {
    return this.checkIdentity(bvn);
  }

  private async checkIdentity(identity: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/verification/karma/${identity}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new AppError(503, "Unable to verify user identity. Please try again.");
      }
      const data = (await response.json()) as any;
      if (data?.status !== "success") {
        throw new AppError(503, "Unable to verify user identity. Please try again.");
      }
      return data.data !== null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(503, "Unable to verify user identity. Please try again.");
    }
  }
}
