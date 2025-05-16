import { IsNotEmpty, IsUrl } from 'class-validator';

export class ScrapeUrlDto {
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
