import { SocialAccount } from '../entities/social-account.entity';

export class FacebookAccountResponseDto {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  providerUserName: string;
  providerEmail?: string;
  pageId?: string;
  pageName?: string;
  status: string;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: SocialAccount): FacebookAccountResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      provider: entity.provider,
      providerUserId: entity.providerUserId,
      providerUserName: entity.providerUserName,
      providerEmail: entity.providerEmail,
      pageId: entity.pageId,
      pageName: entity.pageName,
      status: entity.status,
      connectedAt: entity.connectedAt,
      createdAt: entity.createdAt || entity.created_at,
      updatedAt: entity.updatedAt || entity.updated_at,
    };
  }
}
