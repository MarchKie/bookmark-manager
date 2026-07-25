import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { UserUserPayload } from '../auth/current-user.decorator';

describe('MeController', () => {
  let meController: MeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
    }).compile();

    meController = module.get<MeController>(MeController);
  });

  it('should be defined', () => {
    expect(meController).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the extracted user profile metadata', () => {
      const mockUser: UserUserPayload = {
        sub: 'auth0|candidate-123',
        email: 'candidate@test.com',
        name: 'Test Candidate',
        picture: 'https://avatar.example.com/pic.jpg',
      };

      const result = meController.getProfile(mockUser);

      expect(result).toEqual({
        sub: 'auth0|candidate-123',
        email: 'candidate@test.com',
        name: 'Test Candidate',
        picture: 'https://avatar.example.com/pic.jpg',
      });
    });
  });
});
