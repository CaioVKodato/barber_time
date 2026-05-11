import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Encapsula hashing e verificação de senhas.
 */
export class PasswordHasher {
  static async hash(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  static async verify(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
}
