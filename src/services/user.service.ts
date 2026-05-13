import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import { KarmaService } from "./karma.service";
import { CreateUserPayload, LoginPayload } from "../types";
import { env } from "../config/env";
import { generateAccountNumber, sanitizeUser } from "../utils/helpers";

export class UserService {
  private userRepository: UserRepository;
  private walletRepository: WalletRepository;
  private karmaService: KarmaService;

  constructor() {
    this.userRepository = new UserRepository();
    this.walletRepository = new WalletRepository();
    this.karmaService = new KarmaService();
  }

  async register(payload: CreateUserPayload) {
    const existingEmail = await this.userRepository.findByEmail(payload.email);
    if (existingEmail) throw new Error("Email already in use");

    const existingPhone = await this.userRepository.findByPhone(
      payload.phone_number,
    );
    if (existingPhone) throw new Error("Phone number already in use");

    const isBlacklisted = await this.karmaService.isBlacklisted(payload.email);
    if (isBlacklisted) throw new Error("Account creation denied");

    const password_hash = await bcrypt.hash(payload.password, 12);

    const user = await this.userRepository.create({
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone_number: payload.phone_number,
      password_hash,
    });

    const account_number = generateAccountNumber();
    const wallet = await this.walletRepository.create(user.id, account_number);

    return { user: sanitizeUser(user), wallet };
  }

  async login(payload: LoginPayload) {
    const user = await this.userRepository.findByEmail(payload.email);
    if (!user) throw new Error("Invalid email or password");

    if (!user.is_active) throw new Error("Account is deactivated");

    const isMatch = await bcrypt.compare(payload.password, user.password_hash);
    if (!isMatch) throw new Error("Invalid email or password");

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    return { token, user: sanitizeUser(user) };
  }
}
