import pg from 'pg';
import { DatabasePool } from '../config/DatabasePool.js';
import { AppError } from '../errors/AppError.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { BarberRepository } from '../repositories/BarberRepository.js';
import { PasswordHasher } from '../utils/PasswordHasher.js';
import { JwtService } from '../utils/JwtService.js';

/**
 * Cadastro de prestador (usuário role barber + linha em barbers).
 */
export class BarberService {
  /**
   * @param {UserRepository} userRepository
   * @param {BarberRepository} barberRepository
   */
  constructor(userRepository = new UserRepository(), barberRepository = new BarberRepository()) {
    this.userRepository = userRepository;
    this.barberRepository = barberRepository;
  }

  /**
   * @param {{ email: string; password: string; fullName: string }} input
   */
  async registerBarber(input) {
    this.#assertEmail(input.email);
    this.#assertPassword(input.password);
    if (!input.fullName?.trim()) {
      throw new AppError('Nome completo é obrigatório.', 422);
    }

    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AppError('E-mail já cadastrado.', 409);
    }

    const passwordHash = await PasswordHasher.hash(input.password);
    const pool = DatabasePool.getPool();
    /** @type {pg.PoolClient | null} */
    let client = null;

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      const user = await this.userRepository.create(
        {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          role: 'barber',
        },
        client,
      );

      const barber = await this.barberRepository.create(
        { fullName: input.fullName, userId: user.id },
        client,
      );

      await client.query('COMMIT');

      const token = JwtService.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          createdAt: user.created_at,
        },
        barber: {
          id: barber.id,
          fullName: barber.full_name,
        },
      };
    } catch (err) {
      if (client) await client.query('ROLLBACK');
      if (err && err.code === '23505') {
        throw new AppError('Não foi possível concluir o cadastro do barbeiro (conflito de dados).', 409);
      }
      throw err;
    } finally {
      if (client) client.release();
    }
  }

  async listActiveBarbers() {
    const rows = await this.barberRepository.listActive();
    return rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      active: r.active,
    }));
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
