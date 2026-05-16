import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import { KarmaService } from "./karma.service";
import { CreateUserPayload, LoginPayload } from "../types";
import { env } from "../config/env";
import { generateAccountNumber, sanitizeUser, sanitizeWallet } from "../utils/helpers";
import { AppError } from "../utils/errors";
import { encrypt, hashBvn } from "../utils/encryption";
import db from "../config/database";
import logger from "../utils/logger";

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
    if (existingEmail) throw new AppError(409, "Email already in use");

    const existingPhone = await this.userRepository.findByPhone(payload.phone_number);
    if (existingPhone) throw new AppError(409, "Phone number already in use");

    const bvn_hash = hashBvn(payload.bvn);
    const existingBvn = await this.userRepository.findByBvnHash(bvn_hash);
    if (existingBvn) throw new AppError(409, "An account with this BVN already exists");

    const isBlacklisted = await this.karmaService.isBlacklisted(payload.bvn);
    if (isBlacklisted) {
      logger.warn('Blacklisted user registration attempt blocked');
      throw new AppError(403, "Account creation denied");
    }

    const password_hash = await bcrypt.hash(payload.password, 12);
    const bvn = encrypt(payload.bvn);

    const [user, wallet] = await db.transaction(async (trx) => {
      const user = await this.userRepository.create({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone_number: payload.phone_number,
        bvn,
        bvn_hash,
        password_hash,
      }, trx);

      const account_number = generateAccountNumber();
      const wallet = await this.walletRepository.create(user.id, account_number, trx);

      return [user, wallet] as const;
    });

    logger.info('User registered', { userId: user.id });
    return { user: sanitizeUser(user), wallet: sanitizeWallet(wallet) };
  }

  async login(payload: LoginPayload) {
    const user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      logger.warn('Failed login attempt — email not found');
      throw new AppError(401, "Invalid email or password");
    }

    if (!user.is_active) {
      logger.warn('Login attempt on deactivated account', { userId: user.id });
      throw new AppError(403, "Account is deactivated");
    }

    const isMatch = await bcrypt.compare(payload.password, user.password_hash);
    if (!isMatch) {
      logger.warn('Failed login attempt — wrong password', { userId: user.id });
      throw new AppError(401, "Invalid email or password");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN },
    );

    logger.info('User logged in', { userId: user.id });
    return { token, user: sanitizeUser(user) };
  }
}
