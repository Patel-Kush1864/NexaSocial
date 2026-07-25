import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from '../services/profile.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { UpdateEmailDto } from '../dto/update-email.dto';
import { SearchUserDto } from '../dto/search-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getProfile(user.id);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.profileService.changePassword(user.id, user.sessionId, dto);
    return {
      message: 'Password changed successfully. Logged out of other sessions.',
    };
  }

  @Put('change-email')
  changeEmail(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.profileService.changeEmail(user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException(
              'Only image files (jpg, jpeg, png, webp) are allowed!',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: CurrentUserType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please select an image file to upload');
    }
    const mockCloudUrl = `https://cloudinary.com/nexasocial/avatars/${user.id}_${Date.now()}_${file.originalname}`;
    return this.profileService.uploadAvatar(user.id, mockCloudUrl);
  }

  @Delete('avatar')
  deleteAvatar(@CurrentUser() user: CurrentUserType) {
    return this.profileService.deleteAvatar(user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: CurrentUserType,
    @Body('confirmPassword') confirmPassword?: string,
  ): Promise<{ message: string }> {
    if (!confirmPassword) {
      throw new BadRequestException('Confirmation password is required');
    }
    await this.profileService.deleteAccount(user.id, confirmPassword);
    return { message: 'Account deleted successfully' };
  }

  @Get('activity')
  getActivity(@CurrentUser() user: CurrentUserType) {
    return this.profileService.activity(user.id);
  }

  @Get('search')
  searchUsers(@Query() dto: SearchUserDto) {
    return this.profileService.searchUsers(dto.q);
  }
}
