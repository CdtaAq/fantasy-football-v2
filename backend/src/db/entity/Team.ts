import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Team {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  leagueId!: string;

  @Column()
  ownerId!: string;

  @Column({ nullable: true })
  draftPosition?: number;
}
