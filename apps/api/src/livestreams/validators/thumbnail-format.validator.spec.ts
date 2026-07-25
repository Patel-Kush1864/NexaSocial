import { validate } from 'class-validator';
import { CreateStreamDto } from '../dto/livestream.dto';

describe('IsThumbnailFormat Validator', () => {
  it('should accept valid thumbnail URLs (jpg, png, webp)', async () => {
    const dto = new CreateStreamDto();
    dto.title = 'Test Stream Title';
    dto.connectedAccountIds = ['f47ac10b-58cc-4372-a567-0e02b2c3d479'];
    dto.thumbnail = 'https://example.com/thumbnail.png';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid thumbnail extensions like .pdf or .gif', async () => {
    const dto = new CreateStreamDto();
    dto.title = 'Test Stream Title';
    dto.connectedAccountIds = ['f47ac10b-58cc-4372-a567-0e02b2c3d479'];
    dto.thumbnail = 'https://example.com/file.pdf';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isThumbnailFormat');
  });
});
