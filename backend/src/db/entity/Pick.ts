import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Pick {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  draftId!: string;

  @Column()
  teamId!: string;

  @Column()
  pickNumber!: number;

  @Column({ nullable: true })
  playerId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
