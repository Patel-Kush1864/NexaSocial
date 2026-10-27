import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { AuditService } from '../../audit/services/audit.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditMeta } from '../../audit/decorators/audit-meta.decorator';

@Injectable()
export class AdminAdministratorsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async getAdministrators(
    limit = 20,
    offset = 0,
    search?: string,
    status?: string,
    roleName?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name IN (:...roles)', { roles: ['SUPER_ADMIN', 'ADMIN'] });

    if (search) {
      qb.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    if (roleName) {
      qb.andWhere('role.name = :roleName', { roleName });
    }

    const validSortFields: Record<string, string> = {
      createdAt: 'user.created_at',
      updatedAt: 'user.updated_at',
      name: 'user.firstName',
      status: 'user.status',
    };
    const sortField =
      sortBy && validSortFields[sortBy]
        ? validSortFields[sortBy]
        : 'user.created_at';
    const order = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, order).skip(offset).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const mappedUsers = users.map((user) => this.mapSafeAdministrator(user));

    return {
      data: mappedUsers,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdministratorById(id: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('user.id = :id', { id })
      .andWhere('role.name IN (:...roles)', { roles: ['SUPER_ADMIN', 'ADMIN'] })
      .getOne();

    if (!user) {
      throw new NotFoundException('Administrator not found');
    }

    return this.mapSafeAdministrator(user);
  }

  private mapSafeAdministrator(user: User) {
    const { password, verificationToken, passwordResetToken, ...safeUser } =
      user;
    return {
      ...safeUser,
      createdAt: (user as any).createdAt || user.created_at,
      updatedAt: (user as any).updatedAt || user.updated_at,
    };
  }

  async createAdministrator(
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      roleName: string;
      status?: string;
    },
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const role = await queryRunner.manager.findOne(Role, {
        where: { name: data.roleName },
      });
      if (!role || !['SUPER_ADMIN', 'ADMIN'].includes(role.name)) {
        throw new ConflictException('Invalid administrator role');
      }

      // Generate a random temporary password
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const user = queryRunner.manager.create(User, {
        email: normalizedEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        status: data.status || 'ACTIVE',
        isActive: data.status === 'ACTIVE' || !data.status,
        isEmailVerified: true, // Auto verify for admins created by super admin
        role,
      });

      const savedUser = await queryRunner.manager.save(user);

      await this.auditService.logAction({
        adminUserId,
        action: 'ADMIN_CREATED',
        module: 'ADMINISTRATOR',
        targetType: 'USER',
        targetId: savedUser.id,
        targetName: savedUser.email,
        ipAddress: auditMeta?.ipAddress,
        userAgent: auditMeta?.userAgent,
        requestId: auditMeta?.requestId,
        metadata: { role: savedUser.role.name, status: savedUser.status },
      });

      await queryRunner.commitTransaction();

      return this.mapSafeAdministrator(savedUser);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAdministratorRole(
    id: string,
    roleName: string,
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const user = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('user.role', 'role')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) throw new NotFoundException('Administrator not found');

      const oldRole = user.role.name;
      if (!['SUPER_ADMIN', 'ADMIN'].includes(oldRole)) {
        throw new ConflictException(
          'Target user is not a platform administrator',
        );
      }

      const newRole = await queryRunner.manager.findOne(Role, {
        where: { name: roleName },
      });
      if (!newRole || !['SUPER_ADMIN', 'ADMIN'].includes(newRole.name)) {
        throw new ConflictException('Invalid administrator role');
      }

      if (oldRole === 'SUPER_ADMIN' && newRole.name !== 'SUPER_ADMIN') {
        const activeSuperAdmins = await queryRunner.manager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_write') // Prevent concurrent read/updates
          .leftJoin('user.role', 'role')
          .where('role.name = :roleName', { roleName: 'SUPER_ADMIN' })
          .andWhere('user.status = :status', { status: 'ACTIVE' })
          .getCount();

        if (activeSuperAdmins <= 1) {
          throw new ConflictException(
            'This action is not allowed because this account is the final active SUPER_ADMIN. NexaSocial must always retain at least one active SUPER_ADMIN.',
          );
        }
      }

      user.role = newRole;
      const savedUser = await queryRunner.manager.save(user);

      await this.auditService.logAction({
        adminUserId,
        action: 'ADMIN_ROLE_CHANGED',
        module: 'ADMINISTRATOR',
        targetType: 'USER',
        targetId: savedUser.id,
        targetName: savedUser.email,
        ipAddress: auditMeta?.ipAddress,
        userAgent: auditMeta?.userAgent,
        requestId: auditMeta?.requestId,
        metadata: { oldRole, newRole: newRole.name },
      });

      await queryRunner.commitTransaction();

      return this.mapSafeAdministrator(savedUser);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAdministratorStatus(
    id: string,
    status: string,
    adminUserId: string,
    auditMeta?: AuditMeta,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const user = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('user.role', 'role')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) throw new NotFoundException('Administrator not found');

      const oldStatus = user.status;
      if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role.name)) {
        throw new ConflictException(
          'Target user is not a platform administrator',
        );
      }

      if (
        user.role.name === 'SUPER_ADMIN' &&
        oldStatus === 'ACTIVE' &&
        status !== 'ACTIVE'
      ) {
        const activeSuperAdmins = await queryRunner.manager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_write')
          .leftJoin('user.role', 'role')
          .where('role.name = :roleName', { roleName: 'SUPER_ADMIN' })
          .andWhere('user.status = :status', { status: 'ACTIVE' })
          .getCount();

        if (activeSuperAdmins <= 1) {
          throw new ConflictException(
            'This action is not allowed because this account is the final active SUPER_ADMIN. NexaSocial must always retain at least one active SUPER_ADMIN.',
          );
        }
      }

      user.status = status;
      user.isActive = status === 'ACTIVE';
      const savedUser = await queryRunner.manager.save(user);

      let action = 'ADMIN_STATUS_CHANGED';
      if (status === 'SUSPENDED') action = 'ADMIN_SUSPENDED';
      else if (status === 'INACTIVE') action = 'ADMIN_DEACTIVATED';
      else if (status === 'ACTIVE') action = 'ADMIN_ACTIVATED';

      await this.auditService.logAction({
        adminUserId,
        action,
        module: 'ADMINISTRATOR',
        targetType: 'USER',
        targetId: savedUser.id,
        targetName: savedUser.email,
        ipAddress: auditMeta?.ipAddress,
        userAgent: auditMeta?.userAgent,
        requestId: auditMeta?.requestId,
        metadata: { oldStatus, newStatus: status },
      });

      await queryRunner.commitTransaction();

      return this.mapSafeAdministrator(savedUser);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
