import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1763907163374 implements MigrationInterface {
    name = 'InitDatabase1763907163374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_voices" ADD "mezon_user_name" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_voices" DROP COLUMN "mezon_user_name"`);
    }

}
