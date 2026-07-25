import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/users/users.service';
import { UsersRepository } from '../../../src/users/repositories/users.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../../../src/users/entities/role.entity';
import { createMockUser } from '../../fixtures/user.fixture';
import { createMockRepository } from '../../mocks/repository.mock';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService (Unit)', () => {
  let usersService: UsersService;
  let usersRepository: jest.Mocked<Partial<UsersRepository>>;
  let roleRepository: any;

  beforeEach(async () => {
    roleRepository = createMockRepository();
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      rawRepository: createMockRepository() as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = createMockUser();
      usersRepository.findByEmail!.mockResolvedValue(mockUser as any);

      const result = await usersService.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if user email exists', async () => {
      const existingUser = createMockUser();
      usersRepository.findByEmail!.mockResolvedValue(existingUser as any);

      await expect(
        usersService.create({ email: existingUser.email, password: 'Pass' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and save a new user if email is available', async () => {
      const newUserDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
      };
      usersRepository.findByEmail!.mockResolvedValue(null);
      roleRepository.findOne.mockResolvedValue({
        id: 'role-1',
        name: 'CREATOR',
      });

      const mockSaved = createMockUser({ email: newUserDto.email });
      (usersRepository.rawRepository.create as jest.Mock).mockReturnValue(
        mockSaved,
      );
      (usersRepository.rawRepository.save as jest.Mock).mockResolvedValue(
        mockSaved,
      );

      const result = await usersService.create(newUserDto);
      expect(result.email).toBe(newUserDto.email);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user to update is missing', async () => {
      usersRepository.findById!.mockResolvedValue(null);
      await expect(
        usersService.update('non-existent', { firstName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
