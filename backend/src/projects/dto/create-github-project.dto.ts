import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateGithubProjectDto {
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  @MaxLength(300)
  repositoryUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9._/-]+$/)
  branch?: string;
}
