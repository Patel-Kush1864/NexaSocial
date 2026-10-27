/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UsersRepository } from './repositories/users.repository';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ActivityLog } from './entities/activity-log.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserStatusDto, UserStatus } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserDetailsResponseDto } from './dto/user-details-response.dto';
import { plainToInstance } from 'class-transformer';
import { AuditService } from '../audit/services/audit.service';
import { AuditMeta } from '../audit/decorators/audit-meta.decorator';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    return this.usersRepository.findByEmail(normalizedEmail);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findRoleByName(name: string): Promise<Role> {
    const roleSearchName = name || 'WORKSPACE_OWNER';
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
    roleName = 'WORKSPACE_OWNER',
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
    const normalizedEmail = createUserDto.email
      ? createUserDto.email.trim().toLowerCase()
      : '';

    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : undefined;

    const role = await this.findRoleByName(roleName);

    const user = this.usersRepository.rawRepository.create({
      ...createUserDto,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.usersRepository.rawRepository.save(user);
    console.log(
      `[UsersService.create]: User entity saved into DB with ID: "${savedUser.id}"`,
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: savedUser.id,
        action: 'USER_REGISTERED',
        description: `${savedUser.firstName || 'A user'} registered`,
      }),
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
  async queryUsers(query: QueryUsersDto) {
    const {
      search,
      status,
      role,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.usersRepository.rawRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (search) {
      qb.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    if (role) {
      qb.andWhere('role.name = :role', { role });
    }

    // Sort mapping
    const sortFieldMap: Record<string, string> = {
      name: 'user.firstName',
      email: 'user.email',
      role: 'role.name',
      status: 'user.status',
      lastLoginAt: 'user.updated_at',
      createdAt: 'user.created_at',
    };
    const dbSortField = sortFieldMap[sortBy] || 'user.created_at';

    qb.orderBy(dbSortField, sortOrder);

    const offset = (page - 1) * limit;
    qb.skip(offset).take(limit);

    const [users, total] = await qb.getManyAndCount();

    // To avoid complex left joins that cause pagination issues with OneToMany relationships,
    // we fetch workspaces and subscriptions mapping for the fetched users.
    const userIds = users.map((u) => u.id);

    // Fallbacks if tables are empty or query is empty
    let workspaceCounts: Record<string, number> = {};
    if (userIds.length > 0) {
      // Just mock for now if actual workspace_members relation isn't easily accessible
      workspaceCounts = userIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
    }

    const mappedUsers = users.map((user) => ({
      ...user,
      workspaceCount: workspaceCounts[user.id] || 0,
      subscription: null,
    }));

    return {
      data: mappedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    adminId: string,
    auditMeta?: AuditMeta,
  ): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = dto.status;
    user.isActive = dto.status === UserStatus.ACTIVE;

    const saved = await this.usersRepository.rawRepository.save(user);

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: id,
        action: `USER_${dto.status}`,
        description: `User status changed to ${dto.status} by Admin ${adminId}`,
      }),
    );

    const actionName =
      dto.status === UserStatus.ACTIVE ? 'USER_ACTIVATED' : 'USER_SUSPENDED';
    await this.auditService.logAction({
      adminUserId: adminId,
      action: actionName,
      module: 'USER',
      targetType: 'USER',
      targetId: user.id,
      targetName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      ipAddress: auditMeta?.ipAddress,
      userAgent: auditMeta?.userAgent,
      requestId: auditMeta?.requestId,
      metadata: {
        previousStatus:
          user.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED',
        newStatus: dto.status,
      },
    });

    return saved;
  }

  async updateUserRole(
    id: string,
    dto: UpdateUserRoleDto,
    adminId: string,
    auditMeta?: AuditMeta,
  ): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleRepository.findOne({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (user.role?.name === 'SUPER_ADMIN' && role.name !== 'SUPER_ADMIN') {
      const superAdminsCount = await this.usersRepository.rawRepository.count({
        where: { role: { name: 'SUPER_ADMIN' }, isActive: true },
      });
      if (superAdminsCount <= 1) {
        throw new ConflictException(
          'Cannot demote the last active SUPER_ADMIN.',
        );
      }
    }

    user.role = role;
    const saved = await this.usersRepository.rawRepository.save(user);

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: id,
        action: 'USER_ROLE_CHANGED',
        description: `User role changed to ${role.name} by Admin ${adminId}`,
      }),
    );

    await this.auditService.logAction({
      adminUserId: adminId,
      action: 'USER_ROLE_CHANGED',
      module: 'USER',
      targetType: 'USER',
      targetId: user.id,
      targetName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      ipAddress: auditMeta?.ipAddress,
      userAgent: auditMeta?.userAgent,
      requestId: auditMeta?.requestId,
      metadata: {
        previousRole: user.role?.name,
        newRole: role.name,
      },
    });

    return saved;
  }

  // --- PLATFORM USER DETAILS ---

  async getUserDetails(id: string) {
    const user = await this.usersRepository.rawRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) throw new NotFoundException('User not found');

    const workspaceCount = await this.dataSource
      .query(
        'SELECT COUNT(*) as count FROM workspace_members WHERE user_id = ?',
        [id],
      )
      .then((res) => parseInt(res[0]?.count || '0', 10));

    // Get last login (just from user entity or session)
    const lastSession = await this.dataSource.query(
      'SELECT updated_at FROM user_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [id],
    );

    const safeUser = plainToInstance(UserDetailsResponseDto, {
      ...user,
      workspaceCount,
      lastLoginAt: lastSession[0]?.updated_at || null,
    });

    return safeUser;
  }

  async getUserWorkspaces(id: string, limit = 20, offset = 0) {
    const data = await this.dataSource.query(
      `SELECT w.id, w.name, w.status, w.created_at, wm.role, wm.joined_at 
       FROM workspaces w 
       JOIN workspace_members wm ON w.id = wm.workspace_id 
       WHERE wm.user_id = ? 
       ORDER BY wm.joined_at DESC 
       LIMIT ? OFFSET ?`,
      [id, limit, offset],
    );

    const totalRes = await this.dataSource.query(
      'SELECT COUNT(*) as total FROM workspace_members WHERE user_id = ?',
      [id],
    );

    return { data, total: parseInt(totalRes[0]?.total || '0', 10) };
  }

  async getUserSubscriptions(id: string) {
    const data = await this.dataSource.query(
      `SELECT us.id, us.status, us.start_date as current_period_start, us.end_date as current_period_end, us.cancel_at_period_end, p.name as plan_name, p.interval 
       FROM user_subscriptions us 
       LEFT JOIN subscription_plans p ON us.plan_id = p.id 
       WHERE us.user_id = ? 
       ORDER BY us.created_at DESC`,
      [id],
    );
    return { data, total: data.length };
  }

  async getUserPayments(id: string, limit = 20, offset = 0) {
    const data = await this.dataSource.query(
      `SELECT p.id, p.amount, p.currency, p.status, p.gateway as payment_method_type, p.created_at, pl.name as plan_name 
       FROM payments p 
       LEFT JOIN subscription_plans pl ON p.plan_id = pl.id 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC 
       LIMIT ? OFFSET ?`,
      [id, limit, offset],
    );

    const totalRes = await this.dataSource.query(
      'SELECT COUNT(*) as total FROM payments WHERE user_id = ?',
      [id],
    );

    return { data, total: parseInt(totalRes[0]?.total || '0', 10) };
  }

  async getUserSocialAccounts(id: string) {
    const data = await this.dataSource.query(
      `SELECT ca.id, ca.platform_name, ca.name as account_name, ca.avatar as profile_image_url, ca.status as connection_status, 1 as is_active, ca.created_at, ca.updated_at, ca.updated_at as last_sync_at 
       FROM connected_accounts ca 
       WHERE ca.workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?)
       ORDER BY ca.created_at DESC`,
      [id],
    );
    return { data, total: data.length };
  }

  async getUserStreams(id: string, limit = 20, offset = 0) {
    const data = await this.dataSource.query(
      `SELECT id, title, status, scheduled_at as scheduled_start_time, started_at as actual_start_time, ended_at as actual_end_time, created_at 
       FROM live_streams 
       WHERE created_by = ? OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?) 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [id, id, limit, offset],
    );

    const totalRes = await this.dataSource.query(
      `SELECT COUNT(*) as total FROM live_streams 
       WHERE created_by = ? OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?)`,
      [id, id],
    );

    return { data, total: parseInt(totalRes[0]?.total || '0', 10) };
  }

  async getUserActivity(id: string, limit = 20, offset = 0) {
    const data = await this.dataSource.query(
      `SELECT id, action, COALESCE(description, action) as description, created_at 
       FROM activity_logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [id, limit, offset],
    );

    const totalRes = await this.dataSource.query(
      'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ?',
      [id],
    );

    return { data, total: parseInt(totalRes[0]?.total || '0', 10) };
  }
}
