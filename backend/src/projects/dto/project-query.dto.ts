import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

import { Type } from 'class-transformer';

import { ProjectSource, ProjectStatus } from '@prisma/client';

export class ProjectQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectSource)
  source?: ProjectSource;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
