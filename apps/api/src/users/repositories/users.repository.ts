import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: { roles: true } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email }, relations: { roles: true } });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.repo.findOne({
      where: { phoneNumber },
      relations: { roles: true },
    });
  }

  async update(id: string, partialUser: Partial<User>): Promise<User> {
    await this.repo.update(id, partialUser);
    return this.findById(id) as Promise<User>;
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email } });
    return count > 0;
  }

  async search(query: string): Promise<User[]> {
    return this.repo.find({
      where: [
        { email: Like(`%${query}%`) },
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) },
      ],
      take: 10,
    });
  }

  get rawRepository(): Repository<User> {
    return this.repo;
  }
}
