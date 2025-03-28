import mongoose, { Schema, Document } from "mongoose";
import { WebSocket } from "ws";

interface IPosition {
  x: number;
  y: number;
  z: number;
}

export interface ICharacter extends Document {
  playerId: string;
  ws?: WebSocket | null;
  position: IPosition;
  velocity: any;
  rotation: any;
  health: any;
  animationState: any;
}

const CharacterSchema: Schema = new Schema(
  {
    playerId: { type: String, unique: true },
    ws: { type: Schema.Types.Mixed },
    position: { type: Schema.Types.Mixed, required: true },
    velocity: { type: Schema.Types.Mixed, required: true },
    rotation: { type: Schema.Types.Mixed, required: true },
    health: { type: Schema.Types.Mixed, required: true },
    animationState: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const Character = mongoose.model<ICharacter>("Character", CharacterSchema);