import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";

@Entity()
export class League {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  commissionerId!: string;

  @Column({ type: "int", default: 10 })
  maxTeams!: number;

  @Column({ type: "jsonb", default: {} })
  scoringSettings!: any;

  @CreateDateColumn()
  createdAt!: Date;
}
