import { AppError } from '../errors/AppError.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { PasswordHasher } from '../utils/PasswordHasher.js';
import { JwtService } from '../utils/JwtService.js';

/**
 * Casos de uso de autenticação: cadastro e login de cliente.
 */
export class AuthService {
  /** @param {UserRepository} userRepository */
  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  /**
   * @param {{ email: string; password: string; fullName: string }} input
   */
  async registerClient(input) {
    this.#assertEmail(input.email);
    this.#assertPassword(input.password);
    if (!input.fullName?.trim()) {
      throw new AppError('Nome completo é obrigatório.', 422);
    }

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('E-mail já cadastrado.', 409);
    }

    const passwordHash = await PasswordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: 'client',
    });

    const token = JwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: this.#publicUser(user) };
  }

  /**
   * @param {{ email: string; password: string }} input
   */
  async login(input) {
    this.#assertEmail(input.email);
    if (!input.password) {
      throw new AppError('Senha é obrigatória.', 422);
    }

    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const ok = await PasswordHasher.verify(input.password, user.password_hash);
    if (!ok) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = JwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user: this.#publicUser(user) };
  }

  #publicUser(row) {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  #assertEmail(email) {
    if (!email?.includes('@')) {
      throw new AppError('E-mail inválido.', 422);
    }
  }

  #assertPassword(password) {
    if (!password || password.length < 6) {
      throw new AppError('Senha deve ter no mínimo 6 caracteres.', 422);
    }
  }
}
