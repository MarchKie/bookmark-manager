import { JwtStrategy, JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should extract and map user claims correctly from JWT payload', async () => {
      const payload: JwtPayload = {
        sub: 'auth0|user-sub-456',
        email: 'user@example.com',
        name: 'John Doe',
        picture: 'https://example.com/pic.png',
        iss: 'https://dev-yg.us.auth0.com/',
        aud: 'https://bbl-candidate-test-api',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'auth0|user-sub-456',
        email: 'user@example.com',
        name: 'John Doe',
        picture: 'https://example.com/pic.png',
      });
    });
  });
});
