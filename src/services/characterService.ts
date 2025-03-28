import { ICharacter, Character } from "../models/Character";

export const getNearbyCharacters = async (player: ICharacter, maxDistance: number) => {
  const { x, y, z } = player.position;

  return await Character.find({
    ws: { $ne: null },
    "position.x": { $gte: x - maxDistance, $lte: x + maxDistance },
    "position.y": { $gte: y - maxDistance, $lte: y + maxDistance },
    "position.z": { $gte: z - maxDistance, $lte: z + maxDistance },
  });
};