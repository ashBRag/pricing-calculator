import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'notBothDiscounts', async: false })
class NotBothDiscounts implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as CreateLineItemDto;
    return !(
      obj.discountPercent !== undefined && obj.fixedDiscount !== undefined
    );
  }

  defaultMessage() {
    return 'A line item may have either discountPercent or fixedDiscount, not both.';
  }
}

export class CreateLineItemDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Validate(NotBothDiscounts)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Validate(NotBothDiscounts)
  fixedDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;
}

export class UpdateLineItemDto extends CreateLineItemDto {}
