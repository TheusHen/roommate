/**
 * Browser-based password manager using localStorage
 * Equivalent to Flutter's ApiPasswordManager using SharedPreferences
 */
export class ApiPasswordManager {
  private static readonly key = 'api_password';

  static getPassword(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.key);
  }

  static setPassword(password: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key, password);
  }

  static clearPassword(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.key);
  }

  static hasPassword(): boolean {
    const password = this.getPassword();
    return password !== null && password.length > 0;
  }
}