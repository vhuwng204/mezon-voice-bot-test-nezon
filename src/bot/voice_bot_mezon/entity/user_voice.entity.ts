import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Voice } from './voice.entity';

@Index([
    'mezonUserId',
    'mezonUserName',
    'voiceId',
])
@Index("UNIQUE_user_voice", ['mezonUserId'], { unique: true })

@Entity("user_voices")
export class UserVoice {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text", name: "mezon_user_id", nullable: true })
    mezonUserId: string

    @Column({ type: "text", name: "mezon_user_name", nullable: true })
    mezonUserName: string

    @ManyToOne(() => Voice, (voice) => voice.id)
    @JoinColumn({ name: "voice_id" })
    voiceId: Voice

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