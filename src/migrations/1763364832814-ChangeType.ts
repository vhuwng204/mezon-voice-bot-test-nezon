import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeType1763364832814 implements MigrationInterface {
    name = 'ChangeType1763364832814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_81f2716f3edca10f72c57b6ab5"`);
        await queryRunner.query(`ALTER TABLE "user_voices" DROP COLUMN "mezon_user_id"`);
        await queryRunner.query(`ALTER TABLE "user_voices" ADD "mezon_user_id" bigint NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_81f2716f3edca10f72c57b6ab5" ON "user_voices" ("mezon_user_id", "voice_name", "number_usage", "is_default", "voice_path", "is_private") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_81f2716f3edca10f72c57b6ab5"`);
        await queryRunner.query(`ALTER TABLE "user_voices" DROP COLUMN "mezon_user_id"`);
        await queryRunner.query(`ALTER TABLE "user_voices" ADD "mezon_user_id" text NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_81f2716f3edca10f72c57b6ab5" ON "user_voices" ("mezon_user_id", "voice_path", "voice_name", "is_default", "is_private", "number_usage") `);
    }

}
