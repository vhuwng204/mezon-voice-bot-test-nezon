import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import { ACCESS_LEVEL } from './bot';


@Index([
    'mezonUserId',
    'voiceName',
    'numberUsage',
    'isDefault',
    'voicePath',
    'isPrivate',
])
@Entity("user_voices")
export class UserVoice {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text", name: "mezon_user_id", nullable: true })
    mezonUserId: string

    @Column({ type: "text", name: "mezon_user_name", nullable: true })
    mezonUserName: string

    @Column({ type: "text", name: "voice_path", nullable: true })
    voicePath: string

    @Column({ type: "text", name: "text_ref", nullable: true })
    textRef: string

    @Column({ type: "text", name: "voice_name", nullable: true })
    voiceName: string

    @Column({ type: "boolean", default: false, name: "is_default" })
    isDefault: boolean

    @Column({ type: "enum", enum: ACCESS_LEVEL, default: ACCESS_LEVEL.PRIVATE, name: "is_private" })
    isPrivate: ACCESS_LEVEL

    @Column({ type: "bigint", name: "number_usage", default: 1, nullable: true })
    numberUsage: number

    @Column({ type: "bigint", name: "created_at", nullable: true })
    createdAt: number

    @Column({ type: "bigint", nullable: true, name: "updated_at" })
    updatedAt: number

    @BeforeInsert()
    setCreatedAt() {
        this.createdAt = Date.now()
    }

    @BeforeUpdate()
    setUpdatedAt() {
        this.updatedAt = Date.now()
    }
}