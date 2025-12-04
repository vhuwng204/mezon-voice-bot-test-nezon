import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDBDev1764832519950 implements MigrationInterface {
    name = 'InitDBDev1764832519950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "voices" ("id" SERIAL NOT NULL, "voice_path" text, "text_ref" text, "voice_name" text, "voice_type" "public"."voices_voice_type_enum" NOT NULL DEFAULT 'private', "number_usage" bigint DEFAULT '1', "created_at" bigint, "updated_at" bigint, CONSTRAINT "PK_e9aca1140ce459e098f259fcc47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_adb818f3f3b3dc4da790446201" ON "voices" ("voice_name", "number_usage", "voice_path", "voice_type") `);
        await queryRunner.query(`CREATE TABLE "user_voices" ("id" SERIAL NOT NULL, "mezon_user_id" text, "mezon_user_name" text, "created_at" bigint, "updated_at" bigint, "voice_id" integer, CONSTRAINT "PK_af8c2111ddce5a7644d2cb8501c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UNIQUE_user_voice" ON "user_voices" ("mezon_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_83608a19abf1db0af1b80bc7d1" ON "user_voices" ("mezon_user_id", "mezon_user_name", "voice_id") `);
        await queryRunner.query(`ALTER TABLE "user_voices" ADD CONSTRAINT "FK_22cb1341d8cbea587b2dbda8536" FOREIGN KEY ("voice_id") REFERENCES "voices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_voices" DROP CONSTRAINT "FK_22cb1341d8cbea587b2dbda8536"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_83608a19abf1db0af1b80bc7d1"`);
        await queryRunner.query(`DROP INDEX "public"."UNIQUE_user_voice"`);
        await queryRunner.query(`DROP TABLE "user_voices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_adb818f3f3b3dc4da790446201"`);
        await queryRunner.query(`DROP TABLE "voices"`);
    }

}
