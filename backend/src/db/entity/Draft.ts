import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Draft {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  leagueId!: string;

  @Column({ default: "waiting" })
  status!: "waiting" | "ongoing" | "completed";

  @Column({ type: "jsonb", default: [] })
  picks!: any[]; // store pick list

  @CreateDateColumn()
  createdAt!: Date;
}
