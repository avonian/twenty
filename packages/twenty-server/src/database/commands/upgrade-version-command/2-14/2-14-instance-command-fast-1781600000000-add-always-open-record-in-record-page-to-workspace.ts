import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.14.0', 1781600000000)
export class AddAlwaysOpenRecordInRecordPageToWorkspaceFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."workspace" ADD COLUMN IF NOT EXISTS "isAlwaysOpenRecordInRecordPageEnabled" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."workspace" DROP COLUMN IF EXISTS "isAlwaysOpenRecordInRecordPageEnabled"',
    );
  }
}
