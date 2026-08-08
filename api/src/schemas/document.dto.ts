import { Type } from 'class-transformer';
import {
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { CreateLineItemDto } from './line-item.dto';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  customer: string;

  @IsDateString()
  issueDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];
}

export class UpdateDocumentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  customer: string;

  @IsDateString()
  issueDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];
}
