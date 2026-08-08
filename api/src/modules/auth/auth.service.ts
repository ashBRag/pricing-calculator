import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { SignupDto, LoginDto } from '../../schemas/auth.dto';
import { JwtPayload } from './jwt-payload.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService
  ) {}

  private issueToken(user: { id: string; email: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async signup(dto: SignupDto) {
    const existing = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    return this.issueToken({ id: user.id, email: user.email });
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueToken({ id: user.id, email: user.email });
  }
}
