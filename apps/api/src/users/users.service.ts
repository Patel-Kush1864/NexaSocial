import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersRepository } from './repositories/users.repository';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    return this.usersRepository.findByEmail(normalizedEmail);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findRoleByName(name: string): Promise<Role> {
    const roleSearchName = name || 'Creator';
    const capitalized =
      roleSearchName.charAt(0).toUpperCase() +
      roleSearchName.slice(1).toLowerCase();

    const existingRole = await this.roleRepository.findOne({
      where: [
        { name: roleSearchName },
        { name: capitalized },
        { name: roleSearchName.toUpperCase() },
        { name: roleSearchName.toLowerCase() },
      ],
    });

    if (existingRole) {
      return existingRole;
    }

    // Auto-create role if it does not exist in DB yet
    console.log(
      `[UsersService.findRoleByName]: Role "${capitalized}" not found. Auto-creating role...`,
    );
    const newRole = this.roleRepository.create({
      name: capitalized,
      description: `${capitalized} workspace role`,
    });
    return this.roleRepository.save(newRole);
  }

  async create(
    createUserDto: CreateUserDto,
    roleName = 'Creator',
  ): Promise<User> {
    console.log(
      `[UsersService.create]: Checking if email already exists: "${createUserDto.email}"`,
    );
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      console.log(
        `[UsersService.create]: Conflict detected! Email already exists: "${createUserDto.email}"`,
      );
      throw new ConflictException('Email already exists');
    }

    console.log(
      `[UsersService.create]: Hashing password and creating user entity for email: "${createUserDto.email}"`,
    );
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 12)
      : undefined;

    const role = await this.findRoleByName(roleName);
    const roles = [role];

    const user = this.usersRepository.rawRepository.create({
      ...createUserDto,
      password: hashedPassword,
      roles,
    });

    const savedUser = await this.usersRepository.rawRepository.save(user);
    console.log(
      `[UsersService.create]: User entity saved into DB with ID: "${savedUser.id}"`,
    );
    return savedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.rawRepository.save(user);
  }
}
