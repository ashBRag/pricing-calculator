import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { SignupDto, LoginDto } from '../../schemas/auth.dto';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from './jwt-payload.interface';
import { ConflictError, AuthenticationError } from '../../errors/app-errors';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  private signAccessToken(user: { id: string; email: string }): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
        '15m') as JwtSignOptions['expiresIn'],
    });
  }

  private signRefreshToken(user: { id: string; email: string }): string {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
        '7d') as JwtSignOptions['expiresIn'],
    });
  }

  private async issueTokenPair(user: {
    id: string;
    email: string;
  }): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      REFRESH_TOKEN_SALT_ROUNDS
    );
    await this.userModel
      .updateOne({ _id: user.id }, { refreshTokenHash })
      .exec();

    return { accessToken, refreshToken };
  }

  async signup(dto: SignupDto): Promise<TokenPair> {
    const existing = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    return this.issueTokenPair({ id: user.id, email: user.email });
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash
    );
    if (!passwordMatches) {
      throw new AuthenticationError('Invalid email or password.');
    }

    return this.issueTokenPair({ id: user.id, email: user.email });
  }

  /**
   * Rotates the refresh token on every use: the presented token is checked
   * against the stored hash, then a brand new pair is issued and the old
   * hash is overwritten. This limits replay of a stolen refresh token to a
   * single use before it stops working.
   */
  async refresh(userId: string, presentedToken: string): Promise<TokenPair> {
    const user = await this.userModel.findById(userId).exec();
    if (!user?.refreshTokenHash) {
      throw new AuthenticationError('Refresh token is invalid or expired.');
    }

    const matches = await bcrypt.compare(
      presentedToken,
      user.refreshTokenHash
    );
    if (!matches) {
      throw new AuthenticationError('Refresh token is invalid or expired.');
    }

    return this.issueTokenPair({ id: user.id, email: user.email });
  }

  async logout(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } })
      .exec();
  }
}
