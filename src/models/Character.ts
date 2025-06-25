import mongoose, { Schema, Document } from "mongoose";

interface IPosition {
  x: number;
  y: number;
  z: number;
}

export interface ICharacter extends Document {
  playerId: string;
  position: IPosition;
  velocity: any;
  rotation: any;
  health: any;
  animationState: any;
}

const CharacterSchema: Schema = new Schema(
  {
    playerId: { type: String, unique: true },
    position: { type: Schema.Types.Mixed, required: true },
    velocity: { type: Schema.Types.Mixed, required: true },
    rotation: { type: Schema.Types.Mixed, required: true },
    health: { type: Schema.Types.Mixed, required: true },
    animationState: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const Character = mongoose.model<ICharacter>("Character", CharacterSchema);