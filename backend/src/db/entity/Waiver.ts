import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type WaiverStatus = "PENDING" | "AWARDED" | "REJECTED";

@Entity()
export class Waiver {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  leagueId!: string;

  @Column()
  teamId!: string; // who placed the bid

  @Column()
  playerId!: string;

  @Column({ type: "int", default: 0 })
  bidAmount!: number; // FAAB bid

  @Column({ type: "varchar", default: "PENDING" })
  status!: WaiverStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
