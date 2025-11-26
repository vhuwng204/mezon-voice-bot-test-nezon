import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTextRefColumn1764068409652 implements MigrationInterface {
    name = 'AddTextRefColumn1764068409652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_voices" ADD "text_ref" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_voices" DROP COLUMN "text_ref"`);
    }

}
