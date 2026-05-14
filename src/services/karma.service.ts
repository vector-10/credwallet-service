import { env } from "../config/env";
import { AppError } from "../utils/errors";

export class KarmaService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = env.ADJUTOR_BASE_URL;
    this.apiKey = env.ADJUTOR_API_KEY;
  }

  async isBlacklisted(email: string, phone: string): Promise<boolean> {
    const [emailBlacklisted, phoneBlacklisted] = await Promise.all([
      this.checkIdentity(email),
      this.checkIdentity(phone),
    ]);
    return emailBlacklisted || phoneBlacklisted;
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
      const data = (await response.json()) as any;
      return data?.status === "success" && data?.data !== null;
    } catch {
      throw new AppError(503, "Unable to verify user identity. Please try again.");
    }
  }
}
